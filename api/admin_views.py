from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.conf import settings
from django.core.cache import cache

# Use absolute imports for reliability on AlwaysData
from api.models import User, Order, MenuItem, Restaurant, Category, Coupon
from api.serializers import OrderSerializer, MenuItemSerializer, RestaurantSerializer, CategorySerializer, UserSerializer, CouponSerializer
import csv
import io
import os
from django.core.files.storage import FileSystemStorage

@api_view(['POST'])
def admin_upload_image(request):
    """Handles image uploads for restaurants/menu items."""
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    image_file = request.FILES.get('file')
    if not image_file:
        return Response({'error': 'No file uploaded'}, status=400)

    # Validate file type
    ext = os.path.splitext(image_file.name)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
        return Response({'error': 'Invalid file type. Supported: .jpg, .jpeg, .png, .webp'}, status=400)

    fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'uploads'))
    filename = fs.save(image_file.name, image_file)
    file_url = request.build_absolute_uri(f"{settings.MEDIA_URL}uploads/{filename}")
    return Response({'url': file_url}, status=201)

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

@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
def admin_coupons(request):
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    if request.method == 'GET':
        coupons = Coupon.objects.all().order_by('-created_at')
        return Response(CouponSerializer(coupons, many=True).data)

    elif request.method == 'POST':
        serializer = CouponSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    elif request.method == 'PATCH':
        cpn_id = request.data.get('id')
        try:
            coupon = Coupon.objects.get(pk=cpn_id)
            serializer = CouponSerializer(coupon, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        except Coupon.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    elif request.method == 'DELETE':
        cpn_id = request.data.get('id')
        try:
            coupon = Coupon.objects.get(pk=cpn_id)
            coupon.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Coupon.DoesNotExist:
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
    Advanced CSV Importer (v1.2.6)
    Supports:
    - Auto-delimiter detection (, ; | \t)
    - Fuzzy header matching (aliases & partial matches)
    - Multi-encoding support (UTF-8, CP1252)
    - Transactional atomic writes for speed
    """
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)

    target_type = request.data.get('type')
    csv_file = request.FILES.get('file')

    if not csv_file or not target_type:
        return Response({'error': 'Missing type or file'}, status=400)

    try:
        # Step 0: Try multiple encodings
        content = None
        for enc in ['utf-8-sig', 'cp1252', 'latin-1']:
            try:
                csv_file.seek(0)
                content = csv_file.read().decode(enc)
                break
            except UnicodeDecodeError:
                continue
        
        if not content:
            return Response({'error': 'Unsupported file encoding. Please use UTF-8 or CSV.'}, status=400)

        # Step 0.1: Smart Delimiter Detection
        snippet = content[:2048]
        try:
            dialect = csv.Sniffer().sniff(snippet)
            # Sanity check: if sniffer found something weird like 'a', fallback to comma
            if dialect.delimiter not in [',', ';', '\t', '|']:
                dialect.delimiter = ','
        except:
            dialect = 'excel' # Use default comma

        io_string = io.StringIO(content)
        reader = csv.DictReader(io_string, dialect=dialect)

        from django.db import transaction

        created_count = 0
        updated_count = 0
        errors = []
        categorized_log = [] 

        # Header Normalize Map
        ALIAS_MAP = {
            'name': ['item', 'title', 'product', 'item_name', 'name', 'items', 'menu item'],
            'price': ['rate', 'mrp', 'cost', 'amt', 'amount', 'price', 'unit price'],
            'description': ['desc', 'details', 'info', 'description'],
            'is_veg': ['veg', 'type', 'veg_nonv', 'is_veg', 'isveg'],
            'category_name': ['category', 'cat', 'group', 'section', 'category_name']
        }

        with transaction.atomic():
            for row in reader:
                # Normalize headers: lowcase everything and strip junk
                raw_row = {str(k).lower().strip(): str(v).strip() for k, v in row.items() if k}
                
                # Apply Aliases & Fuzzy Matching
                clean_row = {}
                for canonical, aliases in ALIAS_MAP.items():
                    # 1. Try exact/alias match
                    match_found = False
                    for alias in aliases:
                        if alias in raw_row:
                            clean_row[canonical] = raw_row[alias]
                            match_found = True
                            break
                    
                    # 2. Try partial/contains match if still not found
                    if not match_found:
                        for actual_key in raw_row.keys():
                            for alias in aliases:
                                if alias in actual_key: # e.g. "Item Name (Mandatory)" contains "item_name"
                                    clean_row[canonical] = raw_row[actual_key]
                                    match_found = True
                                    break
                            if match_found: break

                # Fallback for unmapped original columns
                for k, v in raw_row.items():
                    if k not in clean_row: clean_row[k] = v

                if not clean_row.get('name'):
                    continue 

                try:
                    if target_type == 'restaurants':
                        _, created = Restaurant.objects.update_or_create(
                            name=clean_row['name'],
                            defaults={
                                'rating': float(clean_row.get('rating', 4.0) or 4.0),
                                'delivery_time': int(clean_row.get('delivery_time', 30) or 30),
                                'cuisines': clean_row.get('cuisines', 'Various') or 'Various',
                                'image_url': clean_row.get('image_url', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'),
                                'is_featured': str(clean_row.get('is_featured', 'false')).lower() == 'true',
                            }
                        )
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1

                    elif target_type == 'menu':
                        item_name = clean_row['name']
                        description = clean_row.get('description', '')

                        # ── Step 1: Resolve restaurant ──────────────────────────
                        lock_r_id = request.data.get('lock_restaurant_id')
                        if lock_r_id:
                            r_id = lock_r_id
                        else:
                            r_id = clean_row.get('restaurant_id', '').strip()
                            if not r_id and clean_row.get('restaurant_name'):
                                r_match = Restaurant.objects.filter(name__icontains=clean_row['restaurant_name']).first()
                                if r_match:
                                    r_id = r_match.id

                        # ── Step 2: Resolve category ────────────────────────────
                        c_id = clean_row.get('category_id', '').strip()
                        csv_cat_name = clean_row.get('category_name', '').strip()
                        assigned_how = 'csv_id'

                        if not c_id and csv_cat_name:
                            c_match = Category.objects.filter(name__icontains=csv_cat_name).first()
                            if c_match:
                                c_id = c_match.id
                                assigned_how = 'csv_name'

                        if not c_id:
                            auto_cat = auto_categorize(item_name, f"{description} {csv_cat_name}")
                            if auto_cat:
                                c_id = auto_cat.id
                                assigned_how = f'auto:{auto_cat.name}'
                            else:
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

                        # Clean Price: Handle float conversion with fallback
                        try:
                            raw_p = str(clean_row.get('price', 0))
                            clean_p = "".join(c for c in raw_p if c.isdigit() or c == '.')
                            price_val = float(clean_p) if clean_p else 0.0
                        except:
                            price_val = 0.0

                        _, created = MenuItem.objects.update_or_create(
                            name=item_name,
                            defaults={
                                'description': description,
                                'price': price_val,
                                'image_url': clean_row.get('image_url', ''),
                                'is_veg': str(clean_row.get('is_veg', 'true')).lower() not in ['false', '0', 'no', 'non-veg', 'nv'],
                                'rating': float(clean_row.get('rating', 4.5) or 4.5),
                                'prep_time': int(clean_row.get('prep_time', 25) or 25),
                                'category_id': int(c_id),
                                'restaurant_id': int(r_id) if r_id else None,
                                'is_featured': str(clean_row.get('is_featured', 'false')).lower() == 'true',
                                'is_available': str(clean_row.get('is_available', 'true')).lower() not in ['false', '0', 'no'],
                            }
                        )
                        if created:
                            created_count += 1
                        else:
                            updated_count += 1

                except Exception as e:
                    import traceback
                    errors.append({'item': clean_row.get('name', '?'), 'error': str(e)})

        if created_count + updated_count > 0:
            clear_admin_caches()

        return Response({
            'success': True,
            'created': created_count,
            'updated': updated_count,
            'total': created_count + updated_count,
            'detected_headers': list(reader.fieldnames) if reader.fieldnames else [],
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
        'version': '1.2.7',
        'status': 'operational',
        'features': ['promo_code_management', 'restaurant_operational_toggle', 'zero_failure_importer', 'sniffer']
    })

@api_view(['POST'])
def admin_toggle_site(request):
    """Update global site operational status."""
    if request.headers.get('X-Admin-Password', '') != getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098'):
        return Response({'error': 'Unauthorized'}, status=401)
    
    status_val = request.data.get('online', True)
    config, _ = GlobalConfig.objects.get_or_create(key='site_online', defaults={'value': 'true'})
    config.value = 'true' if status_val else 'false'
    config.save()
    
    return Response({'online': config.value == 'true'})
