from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .models import User, Order
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

@api_view(['POST'])
def rider_update_profile(request):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    name = request.data.get('name')
    phone = request.data.get('phone')
    
    if name: user.name = name
    if phone: user.phone = phone
    user.save()
    
    return Response({'message': 'Profile updated', 'user': UserSerializer(user).data})

@api_view(['GET'])
def rider_available_orders(request):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
    # Get active orders assigned to this rider
    active_orders = Order.objects.filter(assigned_rider=user).exclude(status__in=['delivered', 'cancelled']).order_by('-created_at')
    
    if active_orders.exists():
        return Response({
            'active_order': OrderSerializer(active_orders.first()).data,
            'available_orders': []
        })
        
    # If no active order, get available unassigned orders
    available = Order.objects.filter(
        assigned_rider__isnull=True
    ).exclude(
        status__in=['delivered', 'cancelled']
    ).order_by('-created_at')[:10]
    
    return Response({
        'active_order': None,
        'available_orders': OrderSerializer(available, many=True).data
    })

@api_view(['POST'])
def rider_accept_order(request, order_id):
    user = authenticate_rider(request)
    if not user:
        return Response({'error': 'Unauthorized'}, status=401)
        
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
