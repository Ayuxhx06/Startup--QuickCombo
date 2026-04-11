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
    # Clear all caches (blanket clear is safest since menu_list now uses
    # dynamic keys like  menu_list|cat=...|rest=5  for each filter combo).
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
        data = request.data.copy()
        
        # Self-healing: If category is missing but slug is provided (e.g. 'essentials'), find or create it.
        if not data.get('category') and data.get('category_slug'):
            slug = data.get('category_slug')
            cat_name = slug.capitalize()
            # Special case for essentials
            icon = '📦' if 'essential' in slug else '🍽️'
            category, _ = Category.objects.get_or_create(slug=slug, defaults={'name': cat_name, 'icon': icon})
            data['category'] = category.id

        serializer = MenuItemSerializer(data=data)
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

# ─── Smart Auto-Categorization Logic ─────────────────────────────────────────

# Keyword rules: category_slug -> list of keywords to match against item name
CATEGORY_KEYWORD_MAP = [
    # Essentials / Grocery
    ('essentials', [
        'milk', 'bread', 'eggs', 'egg', 'butter', 'ghee', 'oil', 'rice', 'atta',
        'flour', 'sugar', 'salt', 'soap', 'shampoo', 'detergent', 'washing',
        'toothpaste', 'toothbrush', 'tissue', 'napkin', 'grocery', 'essential',
        'daal', 'dal', 'pulses', 'lentil', 'maida', 'semolina', 'suji', 'rava',
        'mustard', 'turmeric', 'haldi', 'masala', 'spice', 'pickle', 'ketchup',
        'sauce', 'vinegar', 'tea', 'chai', 'coffee', 'biscuit', 'juice', 'water',
        'mineral', 'cold drink', 'soft drink', 'aata', 'poha', 'oats', 'cereal',
    ]),
    # Beverages
    ('beverages', [
        'lassi', 'shake', 'milkshake', 'smoothie', 'lemonade', 'nimbu pani',
        'mojito', 'frappe', 'cold coffee', 'iced tea', 'soda', 'sprite',
        'cola', 'pepsi', 'coke', 'thanda', 'sharbat', 'thandai',
    ]),
    # Combos / Meals
    ('combos', [
        'combo', 'meal', 'thali', 'platter', 'set', 'deal', 'value pack',
        'family pack', 'double', 'triple', 'mega', 'feast',
    ]),
    # Snacks / Street Food
    ('snacks', [
        'samosa', 'kachori', 'vada', 'pakora', 'bhajiya', 'pav', 'bhaji',
        'pani puri', 'gol gappa', 'papdi', 'chaat', 'tikki', 'aloo tikki',
        'sev', 'bhel', 'dahi', 'puri', 'cutlet', 'nugget', 'roll', 'wrap',
        'sandwich', 'toast', 'nachos', 'fries', 'chips', 'popcorn', 'spring roll',
        'momos', 'dim sum',
    ]),
    # Main Course / Rice / Roti
    ('main-course', [
        'biryani', 'pulao', 'rice', 'roti', 'naan', 'paratha', 'chapati',
        'butter naan', 'laccha', 'kulcha', 'sabzi', 'curry', 'gravy',
        'paneer', 'dal makhani', 'dal fry', 'rajma', 'chole', 'kadai',
        'palak', 'shahi', 'korma', 'makhni', 'butter chicken', 'chicken tikka',
        'mutton', 'keema', 'kofta', 'nihari', 'haleem', 'bhuna',
    ]),
    # Pizza / Pasta / International
    ('pizza-pasta', [
        'pizza', 'pasta', 'spaghetti', 'penne', 'lasagna', 'risotto',
        'garlic bread', 'bruschetta', 'calzone', 'focaccia',
    ]),
    # Burgers / Fast Food
    ('burgers', [
        'burger', 'double patty', 'veggie burger', 'cheese burger',
        'chicken burger', 'whopper', 'zinger', 'mcaloo', 'hotdog',
    ]),
    # Desserts / Sweets
    ('desserts', [
        'ice cream', 'kulfi', 'gulab jamun', 'rasgulla', 'kheer', 'halwa',
        'ladoo', 'barfi', 'jalebi', 'rabri', 'basundi', 'phirni', 'payasam',
        'brownie', 'cake', 'pastry', 'dessert', 'sweet', 'mithai', 'mousse',
        'pudding', 'cheesecake', 'waffle', 'pancake',
    ]),
    # Breakfast
    ('breakfast', [
        'idli', 'dosa', 'uttapam', 'upma', 'poha', 'pongal', 'vada',
        'medu vada', 'akki roti', 'pesarattu', 'appam', 'paratha', 'aloo paratha',
        'chole bhature', 'puri bhaji', 'breakfast', 'morning',
    ]),
    # Salads / Healthy
    ('salads', [
        'salad', 'healthy', 'diet', 'low calorie', 'green', 'sprouts',
        'quinoa', 'protein bowl', 'buddha bowl', 'fruit bowl',
    ]),
]


def auto_categorize(name: str, description: str = '') -> 'Category | None':
    """
    Auto-assigns a Category based on item name + description keyword matching.
    Returns the best-matched Category object, or None if no match found.
    """
    text = (name + ' ' + description).lower()

    for slug, keywords in CATEGORY_KEYWORD_MAP:
        for kw in keywords:
            if kw in text:
                # Try to find the existing category by slug
                cat = Category.objects.filter(slug=slug).first()
                if cat:
                    return cat
                # Create category if it doesn't exist yet
                display_names = {
                    'essentials': ('Essentials', '📦'),
                    'beverages': ('Beverages', '🥤'),
                    'combos': ('Combos', '🥗'),
                    'snacks': ('Snacks & Street Food', '🍿'),
                    'main-course': ('Main Course', '🍛'),
                    'pizza-pasta': ('Pizza & Pasta', '🍕'),
                    'burgers': ('Burgers', '🍔'),
                    'desserts': ('Desserts & Sweets', '🍰'),
                    'breakfast': ('Breakfast', '🌅'),
                    'salads': ('Salads & Healthy', '🥗'),
                }
                cat_name, cat_icon = display_names.get(slug, (slug.title(), '🍽️'))
                cat, _ = Category.objects.get_or_create(slug=slug, defaults={'name': cat_name, 'icon': cat_icon})
                return cat
    return None


@api_view(['POST'])
def admin_bulk_import(request):
    """
    Bulk import from CSV.
    Payload: { 'type': 'restaurants'|'menu', 'file': CSV_FILE }
    Headers: X-Admin-Password

    For menu items, categories are auto-assigned based on item name/description keywords.
    You can also provide category_name or category_id to override the auto-assignment.
    """
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    target_type = request.data.get('type')
    csv_file = request.FILES.get('file')

    if not csv_file or not target_type:
        return Response({'error': 'Missing type or file'}, status=400)

    try:
        decoded_file = csv_file.read().decode('utf-8-sig')  # utf-8-sig strips BOM if present
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        created_count = 0
        updated_count = 0
        errors = []
        categorized_log = []  # Log which category was auto-assigned

        for row in reader:
            # Strip whitespace from all keys and values
            row = {k.strip(): v.strip() for k, v in row.items() if k}
            if not row.get('name'):
                continue  # skip empty rows

            try:
                if target_type == 'restaurants':
                    _, created = Restaurant.objects.update_or_create(
                        name=row['name'],
                        defaults={
                            'rating': float(row.get('rating', 4.0) or 4.0),
                            'delivery_time': int(row.get('delivery_time', 30) or 30),
                            'cuisines': row.get('cuisines', 'Various') or 'Various',
                            'image_url': row.get('image_url', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c') or 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                            'is_featured': str(row.get('is_featured', 'false')).lower() == 'true',
                        }
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

                elif target_type == 'menu':
                    item_name = row['name']
                    description = row.get('description', '')

                    # ── Step 1: Resolve restaurant ──────────────────────────
                    # If lock_restaurant_id is provided, enforce it over everything else
                    lock_r_id = request.data.get('lock_restaurant_id')
                    
                    if lock_r_id:
                        r_id = lock_r_id
                    else:
                        r_id = row.get('restaurant_id', '').strip()
                        if not r_id and row.get('restaurant_name'):
                            r_match = Restaurant.objects.filter(name__icontains=row['restaurant_name']).first()
                            if r_match:
                                r_id = r_match.id

                    # ── Step 2: Resolve category ────────────────────────────
                    # Priority: category_id (CSV) > category_name (CSV) > auto-categorize
                    c_id = row.get('category_id', '').strip()
                    assigned_how = 'csv_id'

                    if not c_id and row.get('category_name', '').strip():
                        c_match = Category.objects.filter(name__icontains=row['category_name']).first()
                        if c_match:
                            c_id = c_match.id
                            assigned_how = 'csv_name'

                    if not c_id:
                        # Auto-categorize by keyword analysis
                        auto_cat = auto_categorize(item_name, description)
                        if auto_cat:
                            c_id = auto_cat.id
                            assigned_how = f'auto:{auto_cat.name}'
                        else:
                            # Fallback: find or create a generic "Other" category
                            fallback_cat, _ = Category.objects.get_or_create(
                                slug='other',
                                defaults={'name': 'Other', 'icon': '🍽️'}
                            )
                            c_id = fallback_cat.id
                            assigned_how = 'fallback:Other'

                    categorized_log.append({
                        'item': item_name,
                        'category_assigned': assigned_how
                    })

                    _, created = MenuItem.objects.update_or_create(
                        name=item_name,
                        defaults={
                            'description': description,
                            'price': float(row.get('price', 0) or 0),
                            'image_url': row.get('image_url', ''),
                            'is_veg': str(row.get('is_veg', 'true')).lower() not in ['false', '0', 'no'],
                            'rating': float(row.get('rating', 4.5) or 4.5),
                            'prep_time': int(row.get('prep_time', 25) or 25),
                            'category_id': int(c_id),
                            'restaurant_id': int(r_id) if r_id else None,
                            'is_featured': str(row.get('is_featured', 'false')).lower() == 'true',
                            'is_available': str(row.get('is_available', 'true')).lower() not in ['false', '0', 'no'],
                        }
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

            except Exception as e:
                import traceback
                errors.append({'item': row.get('name', '?'), 'error': str(e)})

        if created_count + updated_count > 0:
            clear_admin_caches()

        return Response({
            'success': True,
            'created': created_count,
            'updated': updated_count,
            'total': created_count + updated_count,
            'errors': errors,
            'categorization_log': categorized_log,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def admin_clear_cache(request):
    """Manually clear the public site cache."""
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)
    
    clear_admin_caches()
    return Response({'success': True, 'message': 'Global cache cleared successfully'})

@api_view(['GET'])
def admin_version(request):
    """Return the current infrastructure version for drift detection."""
    return Response({
        'version': '1.2.1',
        'status': 'operational',
        'features': ['manual_sync', 'multi_case_auth', 'hardened_cors']
    })
