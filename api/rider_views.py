from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User, Order, RiderPushSubscription
from .serializers import OrderSerializer, UserSerializer
from django.utils import timezone
from django.db.models import Q

import requests

def authenticate_rider(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer qc-token-'):
        return None
    try:
        token_parts = auth_header.replace('Bearer qc-token-', '').split('-')
        user_id = token_parts[0]
        user = User.objects.get(id=user_id, is_rider=True)
        return user
    except Exception:
        return None

@api_view(['POST'])
def rider_login(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)
        
    try:
        user = User.objects.get(email=email)
        # If user was created via OTP/Google, they have no password set. Set it now.
        if not user.has_usable_password():
            user.set_password(password)
            user.save()
        elif not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=401)
    except User.DoesNotExist:
        # Register new rider
        user = User.objects.create_user(email=email, password=password, is_rider=True)
    
    # Ensure they have rider privileges
    if not user.is_rider:
        user.is_rider = True
        user.save()
        
    return Response({
        'message': 'Login successful',
        'user': UserSerializer(user).data,
        'token': f"qc-token-{user.id}-{user.email}"
    })

@api_view(['POST'])
def rider_google_login(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'Token is required'}, status=400)

    try:
        response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            return Response({'error': 'Invalid Google token'}, status=400)

        data = response.json()
        email = data.get('email', '').lower()
        name = data.get('name', '')

        if not email:
            return Response({'error': 'Email not found in Google account'}, status=400)

        user, created = User.objects.get_or_create(email=email)
        if created or not user.name:
            user.name = name
            user.save()

        # Ensure they have rider privileges
        if not user.is_rider:
            user.is_rider = True
            user.save()

        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'token': f"qc-token-{user.id}-{user.email}"
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET', 'POST'])
def rider_update_profile(request):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if request.method == 'GET':
        return Response({'user': UserSerializer(user).data})
        
    name = request.data.get('name')
    phone = request.data.get('phone')
    vehicle_number = request.data.get('vehicle_number')
    driving_license = request.data.get('driving_license')
    upi_id = request.data.get('upi_id')
    
    if name is not None: user.name = name
    if phone is not None: user.phone = phone
    if vehicle_number is not None: user.vehicle_number = vehicle_number
    if driving_license is not None: user.driving_license = driving_license
    if upi_id is not None: user.upi_id = upi_id
    user.save()
    
    return Response({'message': 'Profile updated', 'user': UserSerializer(user).data})

@api_view(['GET'])
def rider_available_orders(request):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if not user.rider_verified:
        return Response({'error': 'Rider not verified', 'unverified': True}, status=403)
        
    # Get active orders assigned to this rider
    active_orders = Order.objects.filter(
        id__gte=434,
        assigned_rider=user
    ).exclude(status__in=['delivered', 'cancelled']).order_by('-created_at')
    
    if active_orders.exists():
        return Response({
            'active_order': OrderSerializer(active_orders.first()).data,
            'available_orders': []
        })
        
    # If no active order, get only the single latest unassigned active order
    latest_order = Order.objects.filter(
        id__gte=434,
        assigned_rider__isnull=True
    ).exclude(
        status__in=['delivered', 'cancelled']
    ).order_by('-created_at').first()
    
    available_orders = [latest_order] if latest_order else []
    
    return Response({
        'active_order': None,
        'available_orders': OrderSerializer(available_orders, many=True).data
    })

@api_view(['POST'])
def rider_accept_order(request, order_id):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if not user.rider_verified:
        return Response({'error': 'Rider not verified', 'unverified': True}, status=403)
        
    try:
        order = Order.objects.get(id=order_id)
        if order.assigned_rider and order.assigned_rider != user:
            return Response({'error': 'Order already assigned'}, status=400)
            
        order.assigned_rider = user
        if order.status == 'pending':
            order.status = 'confirmed'
        order.save()
        return Response({'message': 'Order accepted', 'order': OrderSerializer(order).data})
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

@api_view(['PATCH'])
def rider_update_status(request, order_id):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if not user.rider_verified:
        return Response({'error': 'Rider not verified', 'unverified': True}, status=403)
        
    try:
        order = Order.objects.get(id=order_id, assigned_rider=user)
        new_status = request.data.get('status')
        if new_status in [choice[0] for choice in Order.STATUS_CHOICES]:
            order.status = new_status
            if new_status == 'delivered':
                order.payment_status = 'paid' # Auto-mark paid on delivery for COD? Or let admin do it? Let rider do it maybe.
            order.save()
            return Response({'message': 'Status updated', 'order': OrderSerializer(order).data})
        return Response({'error': 'Invalid status'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

@api_view(['POST'])
def rider_update_location(request, order_id):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    if not user.rider_verified:
        return Response({'error': 'Rider not verified', 'unverified': True}, status=403)
        
    try:
        order = Order.objects.get(id=order_id, assigned_rider=user)
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        if lat and lng:
            order.rider_lat = lat
            order.rider_lng = lng
            order.save()
            return Response({'message': 'Location updated'})
        return Response({'error': 'Coordinates required'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)


@api_view(['POST'])
def rider_subscribe(request):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)

    if not user.rider_verified:
        return Response({'error': 'Rider not verified', 'unverified': True}, status=403)

    endpoint = request.data.get('endpoint')
    auth_key = request.data.get('auth')
    p256dh_key = request.data.get('p256dh')

    if not endpoint or not auth_key or not p256dh_key:
        return Response({'error': 'Subscription details required'}, status=400)

    RiderPushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            'user': user,
            'auth_key': auth_key,
            'p256dh_key': p256dh_key
        }
    )

    return Response({'message': 'Subscribed successfully'})
