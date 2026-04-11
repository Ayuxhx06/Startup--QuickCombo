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

    if (request.method == 'GET'):
        restaurant_id = request.query_params.get('restaurant_id')
        items = MenuItem.objects.all().select_related('category', 'restaurant').order_by('-id')
        if restaurant_id:
            items = items.filter(restaurant_id=restaurant_id)
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
    # Biryani (Priority: capture specific rice variants first)
    ('biryani', [
        'biryani', 'hyderabadi', 'luknowi', 'pulao', 'pilau', 'tahari', 'kuska',
        'basmati', 'biriyani',
    ]),
    # South Indian
    ('south-indian', [
        'dosa', 'idli', 'idly', 'vada', 'pongal', 'uttapam', 'chettinad', 'sambar',
        'rasam', 'appam', 'akki roti', 'pesarattu', 'upma', 'curry leaf',
        'coconut chutney', 'malabar', 'kerala', 'chennai', 'madras',
    ]),
    # Chinese (Fried Rice/Noodles/Starters)
    ('chinese', [
        'momo', 'chowmein', 'manchurian', 'noodles', 'schezwan', 'fried rice',
        'soup', 'chinese', 'spring roll', 'dim sum', 'hakka', 'manchow', 
        'lollipop', '65', 'chilli', 'dragon', 'ginger chicken', 'sezwan',
    ]),
    # Italian
    ('italian', [
        'pizza', 'pasta', 'spaghetti', 'lasagna', 'risotto', 'garlic bread',
        'bruschetta', 'penne', 'arrabiata', 'alfredo',
    ]),
    # Beverages
    ('beverages', [
        'tea', 'coffee', 'chai', 'juice', 'shake', 'milkshake', 'lassi',
        'smoothie', 'soda', 'coke', 'pepsi', 'sprite', 'water', 'mineral water',
        'cold drink', 'thanda', 'mojito', 'frappe', 'lime', 'mocktail', 'cooler',
        'abooda', 'noora', 'yoyo', 'iced tea', 'horlicks', 'boost', 'badam milk',
    ]),
    # Desserts & Malba
    ('desserts', [
        'cake', 'ice cream', 'dessert', 'sweet', 'mithai', 'gulab jamun',
        'rasgulla', 'halwa', 'kheer', 'brownie', 'pastry', 'waffle', 'pudding',
        'kulfi', 'jalebi', 'falodaa', 'faluda', 'malba', 'fruit salad',
    ]),
    # Fast Food / Snacks / Shawarma / Rolls
    ('fast-food', [
        'burger', 'sandwich', 'wrap', 'fries', 'nugget', 'hotdog', 'chaat',
        'pav bhaji', 'samosa', 'kachori', 'pakora', 'tikki', 'roll', 'nachos',
        'maggi', 'shawarma', 'popcorn', 'finger', 'omelet', 'omelette', 
        'half fried', 'kathi',
    ]),
    # North Indian / Main Course / Tandoori
    ('north-indian', [
        'paneer', 'chicken', 'mutton', 'dal', 'roti', 'naan', 'paratha',
        'kulcha', 'curry', 'gravy', 'thali', 'main course', 'sabzi',
        'butter chicken', 'tikka', 'korma', 'kofta', 'rajma', 'chole',
        'kadai', 'makhani', 'shahi', 'nihari', 'tandoor', 'kabab', 'kebab',
        'alfam', 'alfaham', 'chapati', 'platter', 'plate',
    ]),
    # Healthy / Salads
    ('healthy', [
        'salad', 'healthy', 'diet', 'low calorie', 'sprouts', 'quinoa',
        'fruit bowl', 'oats',
    ]),
    # Essentials (Grocery)
    ('essentials', [
        'milk', 'bread', 'eggs', 'flour', 'grocery', 'atta', 'oil', 'ghee',
        'sugar', 'salt', 'soap', 'shampoo', 'detergent', 'toothpaste',
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

        from django.db import transaction

        created_count = 0
        updated_count = 0
        errors = []
        categorized_log = []  # Log which category was auto-assigned

        # Wrap in a transaction for massive speedup on remote DBs
        with transaction.atomic():
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
                        csv_cat_name = row.get('category_name', '').strip()
                        assigned_how = 'csv_id'

                        if not c_id and csv_cat_name:
                            # Try exact or fuzzy match for site categories
                            c_match = Category.objects.filter(name__icontains=csv_cat_name).first()
                            if c_match:
                                c_id = c_match.id
                                assigned_how = 'csv_name'
                            elif csv_cat_name.lower() in ['others', 'other', 'chicken specials', 'chicken special']:
                                # If it's a generic "Others" or "Specials" label, ignore and use auto-categorize
                                pass

                        if not c_id:
                            # Auto-categorize by keyword analysis (passing both item name and original CSV category for context)
                            auto_cat = auto_categorize(item_name, f"{description} {csv_cat_name}")
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
        'version': '1.2.4',
        'status': 'operational',
        'features': ['manual_sync', 'multi_case_auth', 'hardened_cors', 'v3_categorization', 'partner_menu_manager']
    })
