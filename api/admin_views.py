from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.conf import settings

# Use absolute imports for reliability on AlwaysData
from api.models import User, Order, MenuItem, Restaurant, Category
from api.serializers import OrderSerializer, MenuItemSerializer, RestaurantSerializer, CategorySerializer, UserSerializer

@api_view(['GET'])
def admin_stats(request):
    """
    Enhanced summary stats for the Premium Admin Dashboard.
    Requires X-Admin-Password header.
    """
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    # Sales & Orders
    delivered_orders = Order.objects.filter(status='delivered')
    total_sales = delivered_orders.aggregate(Sum('total'))['total__sum'] or 0
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    active_orders = Order.objects.exclude(status__in=['delivered', 'cancelled']).count()
    
    # Inventory & Users
    total_items = MenuItem.objects.count()
    total_users = User.objects.count()
    total_restaurants = Restaurant.objects.count()
    
    return Response({
        'total_sales': float(total_sales),
        'total_orders': int(total_orders),
        'pending_orders': int(pending_orders),
        'active_orders': int(active_orders),
        'total_items': int(total_items),
        'total_users': int(total_users),
        'total_restaurants': int(total_restaurants),
    })

@api_view(['GET', 'PATCH'])
def admin_orders(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        orders = Order.objects.all().order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)
    
    elif request.method == 'PATCH':
        order_id = request.data.get('order_id')
        new_status = request.data.get('status')
        try:
            order = Order.objects.get(pk=order_id)
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
def admin_menu_items(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        items = MenuItem.objects.all().select_related('category', 'restaurant').order_by('-id')
        return Response(MenuItemSerializer(items, many=True).data)
    
    elif request.method == 'POST':
        serializer = MenuItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        item_id = request.data.get('id')
        try:
            item = MenuItem.objects.get(pk=item_id)
            serializer = MenuItemSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        item_id = request.data.get('id')
        try:
            item = MenuItem.objects.get(pk=item_id)
            item.delete()
            return Response(status=204)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
def admin_categories(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        categories = Category.objects.all().order_by('name')
        return Response(CategorySerializer(categories, many=True).data)

    elif request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        cat_id = request.data.get('id')
        try:
            category = Category.objects.get(pk=cat_id)
            serializer = CategorySerializer(category, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Category.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        cat_id = request.data.get('id')
        try:
            category = Category.objects.get(pk=cat_id)
            category.delete()
            return Response(status=204)
        except Category.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
def admin_restaurants(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        restaurants = Restaurant.objects.all().order_by('name')
        return Response(RestaurantSerializer(restaurants, many=True).data)

    elif request.method == 'POST':
        serializer = RestaurantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        res_id = request.data.get('id')
        try:
            restaurant = Restaurant.objects.get(pk=res_id)
            serializer = RestaurantSerializer(restaurant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        res_id = request.data.get('id')
        try:
            restaurant = Restaurant.objects.get(pk=res_id)
            restaurant.delete()
            return Response(status=204)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

@api_view(['GET'])
def admin_users(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    users = User.objects.all().order_by('-date_joined')
    return Response(UserSerializer(users, many=True).data)
