from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.conf import settings
from django.core.cache import cache

# Use absolute imports for reliability on AlwaysData
from api.models import User, Order, MenuItem, Restaurant, Category
from api.serializers import OrderSerializer, MenuItemSerializer, RestaurantSerializer, CategorySerializer, UserSerializer
import csv
import io

def clear_admin_caches():
    """Invalidate public listing caches after admin mutations."""
    # We clear the specific keys used by @cache_page if known, 
    # but since they are dynamic based on params, clear() is safest for consistency.
    cache.clear()
    print("✨ Admin mutation: Cache cleared for instance reflection.")

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
            clear_admin_caches()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        item_id = request.data.get('id')
        try:
            item = MenuItem.objects.get(pk=item_id)
            serializer = MenuItemSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                clear_admin_caches()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        item_id = request.data.get('id')
        try:
            item = MenuItem.objects.get(pk=item_id)
            item.delete()
            clear_admin_caches()
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
            clear_admin_caches()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        cat_id = request.data.get('id')
        try:
            category = Category.objects.get(pk=cat_id)
            serializer = CategorySerializer(category, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                clear_admin_caches()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Category.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        cat_id = request.data.get('id')
        try:
            category = Category.objects.get(pk=cat_id)
            category.delete()
            clear_admin_caches()
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
            clear_admin_caches()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        res_id = request.data.get('id')
        try:
            restaurant = Restaurant.objects.get(pk=res_id)
            serializer = RestaurantSerializer(restaurant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                clear_admin_caches()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        res_id = request.data.get('id')
        try:
            restaurant = Restaurant.objects.get(pk=res_id)
            restaurant.delete()
            clear_admin_caches()
            return Response(status=204)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

@api_view(['GET'])
def admin_users(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    users = User.objects.all().order_by('-date_joined')
    return Response(UserSerializer(users, many=True).data)

@api_view(['POST'])
def admin_bulk_import(request):
    """
    Bulk import from CSV. 
    Payload: { 'type': 'restaurants'|'menu', 'file': CSV_FILE }
    Headers: X-Admin-Password
    """
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    target_type = request.data.get('type')
    csv_file = request.FILES.get('file')

    if not csv_file or not target_type:
        return Response({'error': 'Missing type or file'}, status=400)

    try:
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        created_count = 0
        errors = []

        for row in reader:
            try:
                if target_type == 'restaurants':
                    Restaurant.objects.update_or_create(
                        name=row['name'],
                        defaults={
                            'rating': float(row.get('rating', 4.0)),
                            'delivery_time': int(row.get('delivery_time', 30)),
                            'cuisines': row.get('cuisines', 'Various'),
                            'image_url': row.get('image_url', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
                            'is_featured': row.get('is_featured', 'false').lower() == 'true',
                            'is_popular': row.get('is_popular', 'false').lower() == 'true'
                        }
                    )
                    created_count += 1
                elif target_type == 'menu':
                    # Dynamic Lookup for related fields to make CSV import more robust
                    r_id = row.get('restaurant_id')
                    if not r_id and row.get('restaurant_name'):
                        r_match = Restaurant.objects.filter(name__icontains=row['restaurant_name']).first()
                        if r_match: r_id = r_match.id
                    
                    c_id = row.get('category_id')
                    if not c_id and row.get('category_name'):
                        c_match = Category.objects.filter(name__icontains=row['category_name']).first()
                        if c_match: c_id = c_match.id

                    MenuItem.objects.update_or_create(
                        name=row['name'],
                        defaults={
                            'description': row.get('description', ''),
                            'price': float(row.get('price', 0)),
                            'image_url': row.get('image_url', ''),
                            'is_veg': row.get('is_veg', 'true').lower() == 'true',
                            'rating': float(row.get('rating', 4.5)),
                            'prep_time': int(row.get('prep_time', 25)),
                            'category_id': int(c_id or 1),
                            'restaurant_id': int(r_id or 1),
                            'is_featured': row.get('is_featured', 'false').lower() == 'true'
                        }
                    )
                    created_count += 1
            except Exception as e:
                errors.append(f"Row error: {str(e)}")

        if created_count > 0:
            clear_admin_caches()

        return Response({
            'success': True,
            'created': created_count,
            'errors': errors
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def admin_clear_cache(request):
    """Manually clear the public site cache."""
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)
    
    clear_admin_caches()
    return Response({'success': True, 'message': 'Global cache cleared successfully'})
