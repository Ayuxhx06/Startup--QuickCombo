import random
import requests
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache as django_cache
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import User, Category, MenuItem, Order, OrderItem, Address, Restaurant, Coupon, CouponUsage, GlobalConfig
from .serializers import (UserSerializer, CategorySerializer, MenuItemSerializer,
                          OrderSerializer, AddressSerializer, RestaurantSerializer, CouponSerializer, GlobalConfigSerializer)


# ─── Auth ─────────────────────────────────────────────────────────────────────

def send_otp_email(to_email, otp, name="User"):
    """Send OTP email using Brevo HTTP API."""
    api_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    sender_email = getattr(settings, 'BREVO_SENDER_EMAIL', 'support@quickcombo.in').strip()

    if not api_key:
        print("❌ Warning: BREVO_API_KEY not configured")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    html_content = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;background:#0a0a0a;color:#fff;border-radius:16px;padding:32px;border:1px solid #22c55e22">
      <h2 style="color:#22c55e;margin:0 0 8px">🥗 QuickCombo</h2>
      <p style="color:#6b7280;margin:0 0 24px">Fast food + essentials delivery</p>
      <p style="font-size:14px;color:#d1d5db">Hi {name}, your one-time password is:</p>
      <div style="background:#111;border:2px solid #22c55e;border-radius:12px;text-align:center;padding:24px;margin:16px 0">
        <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#22c55e">{otp}</span>
      </div>
      <p style="font-size:12px;color:#6b7280">Valid for 10 minutes. Never share this code.</p>
    </div>"""

    data = {
        "sender": {"name": "QuickCombo", "email": sender_email},
        "to": [{"email": to_email, "name": name}],
        "subject": f"Your QuickCombo OTP: {otp}",
        "htmlContent": html_content
    }

    try:
        print(f"--> UWSGI API_KEY LEN: {len(api_key)}")
        print(f"--> UWSGI API_KEY HEAD: {api_key[:10]}")
        print(f"--> UWSGI API_KEY TAIL: {api_key[-10:]}")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        if response.status_code in [200, 201]:
            print(f"✅ OTP email sent successfully to {to_email}")
            return True
        else:
            print(f"❌ Brevo API Error (OTP): {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Request Error (OTP): {e}")
        return False


def send_order_confirmation_email(order):
    """Send order confirmation email using Brevo HTTP API."""
    api_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    sender_email = getattr(settings, 'BREVO_SENDER_EMAIL', 'support@quickcombo.in').strip()
    admin_email = getattr(settings, 'ADMIN_EMAIL', sender_email).strip()

    if not api_key:
        print("❌ Warning: BREVO_API_KEY not configured")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    all_items = list(order.items.all())
    regular_items = [i for i in all_items if not (i.menu_item is None and float(i.price) == 0)]
    special_items = [i for i in all_items if i.menu_item is None and float(i.price) == 0]

    items_html = ""
    # Group items by restaurant
    items_by_restaurant = {}
    for item in regular_items:
        r_name = "QuickCombo Store"
        if item.menu_item and item.menu_item.restaurant:
            r_name = item.menu_item.restaurant.name
        
        if r_name not in items_by_restaurant:
            items_by_restaurant[r_name] = []
        items_by_restaurant[r_name].append(item)

    for r_name, r_items in items_by_restaurant.items():
        items_html += f"<tr><td colspan='3' style='padding:12px 8px 4px;color:#22c55e;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px'>📍 {r_name}</td></tr>"
        for item in r_items:
            # Get specific variation/info if any
            items_html += (
                f"<tr><td style='padding:8px;color:#d1d5db'>{item.quantity} {item.unit if item.unit != 'piece' else 'pc'} {item.name}</td>"
                f"<td style='padding:8px;color:#6b7280;text-align:center'>x{item.quantity}</td>"
                f"<td style='padding:8px;color:#22c55e;text-align:right'>₹{item.price * item.quantity}</td></tr>"
            )

    special_requests_html = ""
    if special_items:
        rows = "".join([
            f"<tr><td style='padding:6px 8px;color:#d1d5db'>📦 {item.quantity} {item.unit if item.unit != 'piece' else 'pc'} {item.name}</td>"
            f"<td style='padding:6px 8px;color:#fb923c;text-align:right;font-size:11px;font-weight:700'>Pay on delivery</td></tr>"
            for item in special_items
        ])
        special_requests_html = f"""
        <div style="background:#fb923c11;border:1px solid #fb923c33;border-radius:12px;padding:16px;margin-top:16px">
          <p style="color:#fb923c;font-weight:800;margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px">📦 Special Requests</p>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tbody>{rows}</tbody>
          </table>
          <p style="color:#9ca3af;font-size:11px;margin:10px 0 0;line-height:1.5">
            The amount of special order is to be paid when delivered to the delivery person and will be informed by them.
          </p>
        </div>"""

    # ETA logic
    has_food, has_essentials = False, False
    for i in all_items:
        if i.menu_item and i.menu_item.category:
            n = i.menu_item.category.name.lower()
            if 'essential' in n or 'grocery' in n: has_essentials = True
            else: has_food = True
        elif i.menu_item is None and float(i.price) == 0:
            has_essentials = True
        
    eta = "35-40 mins"
    if has_food and has_essentials: eta = "40-45 mins"
    elif has_essentials and not has_food: eta = "15-20 mins"

    billing_update_html = ""
    if has_essentials and regular_items:
        billing_update_html = f"""
        <div style="background:#22c55e11;border:1px solid #22c55e33;border-radius:12px;padding:16px;margin-top:20px;text-align:left">
          <p style="color:#22c55e;font-weight:800;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px">⚠️ Important Billing Update</p>
          <p style="color:#d1d5db;font-size:13px;margin:0;line-height:1.5">
            Final bill will be shared with you via WhatsApp. <br/><br/>
            • If you have already paid the cart amount, you can pay the remaining amount to the delivery person. <br/>
            • If you selected Cash on Delivery, please pay the full final bill amount directly to the delivery person.
          </p>
        </div>"""

    html_template = f"""
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#0a0a0a;color:#fff;border-radius:16px;padding:32px;border:1px solid #22c55e22">
      <h2 style="color:#22c55e">@TITLE@</h2>
      <p style="color:#d1d5db">@MESSAGE@</p>
      <div style="background:#111;border-radius:12px;padding:16px;margin:16px 0">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <thead><tr>
            <th style="text-align:left;color:#6b7280;padding:8px;border-bottom:1px solid #1f2937">Item</th>
            <th style="color:#6b7280;padding:8px;border-bottom:1px solid #1f2937">Qty</th>
            <th style="text-align:right;color:#6b7280;padding:8px;border-bottom:1px solid #1f2937">Price</th>
          </tr></thead>
          <tbody>{items_html}</tbody>
        </table>
        <div style="border-top:1px solid #1f2937;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between">
          <span style="color:#6b7280">Subtotal</span><span style="color:#d1d5db">₹{order.subtotal}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0">
          <span style="color:#6b7280">Delivery Fee</span><span style="color:#d1d5db">₹{order.delivery_fee}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:18px;font-weight:700">
          <span style="color:#fff">Total</span><span style="color:#22c55e">₹{order.total}</span>
        </div>
      </div>
      {special_requests_html}
      <div style="text-align:center;color:#6b7280;font-size:14px;margin-top:16px">
        <p>Estimated Delivery: <span style="color:#22c55e;font-weight:700">{eta}</span></p>
        <p>Delivery to: {order.delivery_address}</p>
        {billing_update_html}
      </div>
    </div>"""


    # Send to User
    user_subject = f"🎉 Order Confirmed! #QC{order.id:04d}"
    user_html = html_template.replace("@TITLE@", "🥗 QuickCombo — Order Confirmed!").replace("@MESSAGE@", f"Hi {order.user_name}, your order is being prepared! 🚀")
    
    user_data = {
        "sender": {"name": "QuickCombo", "email": sender_email},
        "to": [{"email": order.user_email, "name": order.user_name}],
        "subject": user_subject,
        "htmlContent": user_html
    }

    try:
        requests.post(url, headers=headers, json=user_data, timeout=10)
        
        # Send to Admin
        if admin_email:
            admin_subject = f"🚨 New Order Alert! #QC{order.id:04d} from {order.user_name}"
            admin_message = (
                f"New order received. Prepare immediately! 🚀<br><br>"
                f"<div style='background:#0f1a0f;border:1px solid #22c55e55;border-radius:12px;padding:16px;margin-top:8px'>"
                f"<p style='color:#22c55e;font-weight:800;margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px'>📋 Customer Contact</p>"
                f"<table width='100%' cellpadding='0' cellspacing='0' border='0'>"
                f"<tr><td style='padding:5px 0;color:#9ca3af;font-size:13px;width:90px'>👤 Name</td>"
                f"<td style='color:#ffffff;font-size:13px;font-weight:700'>{order.user_name}</td></tr>"
                f"<tr><td style='padding:5px 0;color:#9ca3af;font-size:13px'>📱 Phone</td>"
                f"<td style='color:#22c55e;font-size:17px;font-weight:900;letter-spacing:2px'>{order.user_phone}</td></tr>"
                f"<tr><td style='padding:5px 0;color:#9ca3af;font-size:13px'>✉️ Email</td>"
                f"<td style='color:#d1d5db;font-size:13px'>{order.user_email}</td></tr>"
                f"<tr><td style='padding:5px 0;color:#9ca3af;font-size:13px'>💳 Payment</td>"
                f"<td style='color:#f59e0b;font-size:13px;font-weight:700;text-transform:uppercase'>{order.payment_method} — {order.payment_status}</td></tr>"
                f"</table></div>"
            )
            admin_html = html_template.replace("@TITLE@", "🥗 QuickCombo — NEW ORDER!").replace("@MESSAGE@", admin_message)

            admin_data = {
                "sender": {"name": "QuickCombo", "email": sender_email},
                "to": [{"email": admin_email, "name": "Admin"}],
                "subject": admin_subject,
                "htmlContent": admin_html
            }
            requests.post(url, headers=headers, json=admin_data, timeout=10)
            
        return True
    except Exception as e:
        print(f"❌ Request Error (Order confirmation): {e}")
        return False


@api_view(['POST'])
def send_otp(request):
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'Email is required'}, status=400)

    user, created = User.objects.get_or_create(email=email)
    otp = user.generate_otp()

    if send_otp_email(email, otp, user.name or "User"):
        return Response({'message': 'OTP sent successfully', 'email': email})
    return Response({'error': 'Failed to send OTP'}, status=500)


@api_view(['POST'])
def verify_otp(request):
    email = request.data.get('email', '').strip().lower()
    otp = request.data.get('otp', '').strip()
    name = request.data.get('name', '')
    phone = request.data.get('phone', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    # Check OTP validity (10 minutes)
    if user.otp != otp:
        return Response({'error': 'Invalid OTP'}, status=400)

    if user.otp_created_at and (timezone.now() - user.otp_created_at) > timedelta(minutes=10):
        return Response({'error': 'OTP expired'}, status=400)

    if not name or not phone:
        return Response({'error': 'Name and Phone Number are required for first-time login'}, status=400)

    # Update user info
    user.name = name
    user.phone = phone
    user.otp = ''
    user.save()

    return Response({
        'message': 'Login successful',
        'user': UserSerializer(user).data,
        'token': f"qc-token-{user.id}-{user.email}"  # Simple token for demo
    })


@api_view(['GET', 'PATCH'])
def user_profile(request):
    email = request.headers.get('X-User-Email', '').strip().lower()
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'error': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        addresses = AddressSerializer(user.addresses.all(), many=True).data
        orders_count = Order.objects.filter(user_email=email).count()
        data = UserSerializer(user).data
        data['addresses'] = addresses
        data['orders_count'] = orders_count
        return Response(data)

    elif request.method == 'PATCH':
        for field in ['name', 'phone']:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UserSerializer(user).data)


# ─── Menu ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def menu_list(request):
    category_slug = request.GET.get('category', '')
    search = request.GET.get('search', '')
    featured = request.GET.get('featured', '')
    combo_eligible = request.GET.get('combo', '')
    restaurant_id = request.GET.get('restaurant', '')

    # Build a cache key that includes all query params so restaurant/category
    # filters get their own separate cache entries.
    cache_key = f"menu_list|cat={category_slug}|search={search}|feat={featured}|combo={combo_eligible}|rest={restaurant_id}_v2"
    cached = django_cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    from django.db.models import Q
    # Filter is_available AND (linked restaurant is_active OR no restaurant linked)
    items = MenuItem.objects.filter(
        Q(is_available=True),
        Q(restaurant__is_active=True) | Q(restaurant__isnull=True)
    ).select_related('category', 'restaurant')

    if category_slug:
        items = items.filter(category__slug=category_slug)
    if search:
        items = items.filter(name__icontains=search)
    if featured:
        items = items.filter(is_featured=True)
    if combo_eligible:
        items = items.filter(is_combo_eligible=True)
    if restaurant_id:
        items = items.filter(restaurant_id=restaurant_id)

    data = MenuItemSerializer(items, many=True).data
    django_cache.set(cache_key, data, 60 * 5)  # 5 min per unique filter combo
    return Response(data)


@api_view(['GET'])
def categories_list(request):
    restaurant_id = request.GET.get('restaurant', '')
    cache_key = f'categories_list_rest_{restaurant_id}'
    cached = django_cache.get(cache_key)
    if cached is not None:
        return Response(cached)
        
    if restaurant_id:
        categories = Category.objects.filter(restaurants__id=restaurant_id).distinct()
    else:
        categories = Category.objects.all()
        
    data = CategorySerializer(categories, many=True).data
    django_cache.set(cache_key, data, 60 * 10)  # 10 min cache
    return Response(data)


@api_view(['GET'])
def menu_item_detail(request, pk):
    try:
        item = MenuItem.objects.get(pk=pk, is_available=True)
        return Response(MenuItemSerializer(item).data)
    except MenuItem.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['GET'])
def debug_db(request):
    from django.conf import settings
    import os
    db_url = os.environ.get('DATABASE_URL', 'NOT_SET')
    masked_url = db_url[:15] + "..." if db_url != 'NOT_SET' else 'NOT_SET'
    
    try:
        count = Restaurant.objects.count()
        conn_status = "OK"
    except Exception as e:
        count = -1
        conn_status = f"ERROR: {str(e)}"

    return Response({
        "db_url": masked_url,
        "engine": settings.DATABASES['default']['ENGINE'],
        "connection": conn_status,
        "restaurant_count": count
    })


@api_view(['GET'])
def restaurant_list(request):
    from .models import Restaurant
    cached = django_cache.get('restaurant_list_v2')
    if cached is not None:
        return Response(cached)
    
    # Only show active restaurants
    restaurants = Restaurant.objects.filter(is_active=True).order_by('-rating')
    data = RestaurantSerializer(restaurants, many=True).data
    django_cache.set('restaurant_list_v2', data, 60 * 15)
    return Response(data)


# ─── Coupons ─────────────────────────────────────────────────────────────────

@api_view(['POST'])
def validate_coupon(request):
    """Checks if a coupon is valid for a specific user and cart value."""
    code = request.data.get('code', '').strip().upper()
    email = request.data.get('email', '').strip().lower()
    cart_value = float(request.data.get('cart_value', 0))

    if not code:
        return Response({'valid': False, 'message': 'Coupon code is required'}, status=400)

    try:
        coupon = Coupon.objects.get(code=code, is_active=True)
    except Coupon.DoesNotExist:
        return Response({'valid': False, 'message': 'Invalid coupon code'}, status=404)

    # 1. Check Expiry
    if coupon.expiry_date < timezone.now():
        return Response({'valid': False, 'message': 'Coupon has expired'}, status=400)

    # 2. Check Min Order Value
    if cart_value < float(coupon.min_order_value):
        return Response({'valid': False, 'message': f'Minimum order value of ₹{coupon.min_order_value} required'}, status=400)

    # 3. Check Total Max Uses
    if coupon.total_max_uses and coupon.times_used >= coupon.total_max_uses:
        return Response({'valid': False, 'message': 'Coupon limit reached'}, status=400)

    # 4. Check Per User Uses
    if email:
        user_usages = CouponUsage.objects.filter(user_email=email, coupon=coupon).count()
        if user_usages >= coupon.max_uses_per_user:
            return Response({'valid': False, 'message': f'You have already used this coupon {user_usages} time(s)'}, status=400)

    # Calculate preview discount
    discount = 0
    if coupon.discount_type == 'percentage':
        discount = (cart_value * float(coupon.discount_value)) / 100
        if coupon.max_discount_amount:
            discount = min(discount, float(coupon.max_discount_amount))
    else:
        discount = float(coupon.discount_value)

    return Response({
        'valid': True,
        'discount_amount': round(discount, 2),
        'message': f'Coupon "{code}" applied successfully!',
        'details': CouponSerializer(coupon).data
    })

@api_view(['GET'])
def public_coupons(request):
    """List active coupons for the checkout page."""
    coupons = Coupon.objects.filter(is_active=True, expiry_date__gt=timezone.now()).order_by('min_order_value')
    return Response(CouponSerializer(coupons, many=True).data)

def calculate_delivery_fee(items_data):
    """
    New Rules:
    - 1 Restaurant (No Essentials): ₹15
    - 2+ Restaurants OR (1 Restaurant + Essentials): ₹30
    - Subtotal > ₹210: FREE (₹0)
    - Max: ₹30
    """
    subtotal = sum(float(i['price']) * int(i['quantity']) for i in items_data)
    if subtotal > 210:
        return 0, subtotal
    
    unique_restaurants = set()
    has_essentials = False
    
    for item in items_data:
        try:
            item_id = str(item['id'])
            if item_id.startswith('req-'):
                has_essentials = True
                continue
                
            menu_item = MenuItem.objects.get(pk=int(float(item_id)))
            if menu_item.restaurant_id:
                unique_restaurants.add(menu_item.restaurant_id)
            
            cat_name = menu_item.category.name.lower() if menu_item.category else ""
            if 'essential' in cat_name or 'grocery' in cat_name:
                has_essentials = True
        except:
            continue
            
    rest_count = len(unique_restaurants)
    if rest_count == 1 and not has_essentials:
        return 15, subtotal
    if rest_count >= 2 or has_essentials or (rest_count == 0 and has_essentials):
        return 30, subtotal
        
    return 30, subtotal

# ─── Orders ───────────────────────────────────────────────────────────────────

@api_view(['POST'])
def place_order(request):
    try:
        data = request.data
        items_data = data.get('items', [])
        email = data.get('email', '').strip().lower()
        coupon_code = data.get('coupon_code', '').strip().upper()

        if not items_data:
            return Response({'error': 'No items in order'}, status=400)
        
        if not data.get('name') or not data.get('phone'):
            return Response({'error': 'Name and Phone Number are required to place an order'}, status=400)

        # 1. Calculate Delivery Fee & Subtotal
        delivery_fee, subtotal = calculate_delivery_fee(items_data)
        discount_amount = 0
        applied_coupon_obj = None

        # 2. Handle Coupon
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                # Re-validate on server side to be safe
                if (coupon.expiry_date >= timezone.now() and 
                    subtotal >= float(coupon.min_order_value) and 
                    (not coupon.total_max_uses or coupon.times_used < coupon.total_max_uses)):
                    
                    # User usage check
                    user_usage_count = CouponUsage.objects.filter(user_email=email, coupon=coupon).count()
                    if user_usage_count < coupon.max_uses_per_user:
                        # Calculate actual discount
                        if coupon.discount_type == 'percentage':
                            discount_amount = (subtotal * float(coupon.discount_value)) / 100
                            if coupon.max_discount_amount:
                                discount_amount = min(discount_amount, float(coupon.max_discount_amount))
                        else:
                            discount_amount = float(coupon.discount_value)
                        
                        applied_coupon_obj = coupon
            except Coupon.DoesNotExist:
                pass # Silently ignore invalid coupon on final place_order if it was somehow bypassed

        # Override delivery fee if coupon has is_free_delivery
        if applied_coupon_obj and applied_coupon_obj.is_free_delivery:
            delivery_fee = 0

        total = (subtotal - float(discount_amount)) + delivery_fee

        # 3. Create Order
        order = Order.objects.create(
            user_email=email,
            user_name=data.get('name', ''),
            user_phone=data.get('phone', ''),
            delivery_address=data.get('address', ''),
            delivery_lat=data.get('lat') or 12.8231,
            delivery_lng=data.get('lng') or 80.0453,
            payment_method=data.get('payment_method', 'cod'),
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount_amount=discount_amount,
            applied_coupon=coupon_code if applied_coupon_obj else "",
            total=total,
            notes=data.get('notes', ''),
            status='out_for_delivery',
        )

        # 4. Record Coupon Usage
        if applied_coupon_obj:
            CouponUsage.objects.create(
                user_email=email,
                coupon=applied_coupon_obj,
                order=order
            )
            applied_coupon_obj.times_used += 1
            applied_coupon_obj.save()

        # 5. Create Items
        for item_data in items_data:
            item_id = item_data.get('id')
            menu_item = None
            try:
                numeric_val = float(str(item_id))
                menu_item = MenuItem.objects.get(pk=int(numeric_val))
            except (MenuItem.DoesNotExist, ValueError, TypeError):
                menu_item = None

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                name=item_data['name'],
                price=item_data['price'],
                quantity=item_data['quantity'],
                unit=item_data.get('unit') or 'piece'
            )

        # 6. Send Confirmation
        send_order_confirmation_email(order)

        return Response({'order_id': order.id, 'total': float(total), 'status': 'out_for_delivery'}, status=201)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def active_order(request):
    email = request.headers.get('X-User-Email', '').strip().lower()
    if not email:
        return Response(None, status=200)
    # Get most recent order that isn't finished
    order = Order.objects.filter(
        user_email__iexact=email
    ).exclude(status__in=['delivered', 'cancelled']).order_by('-created_at').first()
    
    if not order:
        return Response(None, status=200)
    return Response(OrderSerializer(order).data)


@api_view(['GET'])
def order_list(request):
    email = request.headers.get('X-User-Email', '').strip().lower()
    if not email:
        return Response([], status=200)
    orders = Order.objects.filter(user_email__iexact=email).order_by('-created_at')
    return Response(OrderSerializer(orders, many=True).data)


@api_view(['GET'])
def order_detail(request, order_id):
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    # Simulate rider movement
    if order.status == 'out_for_delivery' and order.delivery_lat:
        import math
        elapsed = (timezone.now() - order.updated_at).seconds / 60
        progress = min(elapsed / 25, 1.0)
        # Rider starts 2km away, moves toward delivery location
        start_lat = float(order.delivery_lat) + 0.018
        start_lng = float(order.delivery_lng) + 0.015
        order.rider_lat = start_lat + (float(order.delivery_lat) - start_lat) * progress
        order.rider_lng = start_lng + (float(order.delivery_lng) - start_lng) * progress

    return Response(OrderSerializer(order).data)


@api_view(['GET'])
def order_tracking(request, order_id):
    """Returns current tracker state for the order timeline."""
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    steps = ['confirmed', 'preparing', 'out_for_delivery', 'delivered']
    current_step = steps.index(order.status) if order.status in steps else 0

    rider_lat = order.rider_lat
    rider_lng = order.rider_lng

    d_lat = float(order.delivery_lat) if order.delivery_lat else 12.8231
    d_lng = float(order.delivery_lng) if order.delivery_lng else 80.0453
    
    # Retroactive fix for already placed New Delhi orders in DB
    if d_lat == 28.6139 and d_lng == 77.2090:
        d_lat = 12.8231
        d_lng = 80.0453

    start_lat = d_lat + 0.015
    start_lng = d_lng + 0.012
    
    if not rider_lat:
        rider_lat = start_lat
        rider_lng = start_lng
        
    if order.status == 'out_for_delivery':
        elapsed_seconds = (timezone.now() - order.updated_at).seconds
        progress = min(elapsed_seconds / 300.0, 1.0)
        rider_lat = start_lat + (d_lat - start_lat) * progress
        rider_lng = start_lng + (d_lng - start_lng) * progress
    elif order.status == 'delivered':
        rider_lat = d_lat
        rider_lng = d_lng

    has_food, has_essentials = False, False
    for i in order.items.all():
        if i.menu_item and i.menu_item.category:
            n = i.menu_item.category.name.lower()
            if 'essential' in n or 'grocery' in n: has_essentials = True
            else: has_food = True
        else: has_food = True
    
    eta = "35-40 min"
    if has_food and has_essentials: eta = "40-45 min"
    elif has_essentials and not has_food: eta = "15-20 min"
    
    eta_string = eta
    if order.status == 'out_for_delivery':
        elapsed_minutes = (timezone.now() - order.updated_at).seconds // 60
        max_minutes = int(eta_string.split('-')[1].split()[0]) if '-' in eta_string else 35
        remaining = max(2, max_minutes - elapsed_minutes)
        eta_string = f"{remaining} min"

    return Response({
        'order_id': order.id,
        'status': order.status,
        'current_step': current_step,
        'steps': [
            {'key': 'confirmed', 'label': 'Order Confirmed', 'icon': '✅', 'done': current_step >= 0},
            {'key': 'preparing', 'label': 'Preparing', 'icon': '👨‍🍳', 'done': current_step >= 1},
            {'key': 'out_for_delivery', 'label': 'Out for Delivery', 'icon': '🛵', 'done': current_step >= 2},
            {'key': 'delivered', 'label': 'Delivered', 'icon': '🎉', 'done': current_step >= 3},
        ],
        'rider_lat': rider_lat,
        'rider_lng': rider_lng,
        'delivery_lat': d_lat,
        'delivery_lng': d_lng,
        'restaurant_lat': d_lat + 0.015,
        'restaurant_lng': d_lng + 0.012,
        'eta_string': eta_string,
    })


# ─── Location ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
def location_autocomplete(request):
    q = request.GET.get('q', '')
    if not q or len(q) < 3:
        return Response([])
    try:
        api_key = getattr(settings, 'GEOAPIFY_KEY', '')
        if not api_key:
            print("Error: GEOAPIFY_KEY not configured.")
            return Response({'error': 'Location service not configured'}, status=500)

        r = requests.get(
            "https://api.geoapify.com/v1/geocode/autocomplete",
            params={'text': q, 'apiKey': api_key, 'limit': 5, 'filter': 'countrycode:in'},
            timeout=8
        )
        if r.status_code != 200:
             print(f"Geoapify Error (Autocomplete): {r.status_code} - {r.text}")
             return Response({'error': 'Location service error'}, status=r.status_code)

        features = r.json().get('features', [])
        results = [{
            'display': f.get('properties', {}).get('formatted', ''),
            'name': f.get('properties', {}).get('name', ''),
            'city': f.get('properties', {}).get('city', ''),
            'lat': f.get('properties', {}).get('lat'),
            'lng': f.get('properties', {}).get('lon'),
        } for f in features]
        return Response(results)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def reverse_geocode(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    if not lat or not lng:
        return Response({'error': 'lat and lng required'}, status=400)
    try:
        api_key = getattr(settings, 'GEOAPIFY_KEY', '')
        if not api_key:
             print("Error: GEOAPIFY_KEY not configured.")
             return Response({'error': 'Location service not configured'}, status=500)

        r = requests.get(
            "https://api.geoapify.com/v1/geocode/reverse",
            params={'lat': lat, 'lon': lng, 'apiKey': api_key},
            timeout=8
        )
        if r.status_code != 200:
             print(f"Geoapify Error (Reverse): {r.status_code} - {r.text}")
             return Response({'error': 'Location service error'}, status=r.status_code)

        features = r.json().get('features', [])
        if features:
            props = features[0].get('properties', {})
            return Response({'address': props.get('formatted', '')})
        return Response({'address': ''})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ─── Weather ──────────────────────────────────────────────────────────────────

@api_view(['GET'])
def weather(request):
    lat = request.GET.get('lat', '28.6139')  # Default: New Delhi
    lng = request.GET.get('lng', '77.2090')
    try:
        r = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={'latitude': lat, 'longitude': lng,
                    'current': 'temperature_2m,weathercode,windspeed_10m',
                    'timezone': 'Asia/Kolkata'},
            timeout=8
        )
        data = r.json().get('current', {})
        code = data.get('weathercode', 0)

        # Map WMO weather codes -> emoji + description
        weather_map = {
            0: ('☀️', 'Clear'), 1: ('🌤️', 'Mostly Clear'), 2: ('⛅', 'Partly Cloudy'),
            3: ('☁️', 'Overcast'), 45: ('🌫️', 'Foggy'), 48: ('🌫️', 'Foggy'),
            51: ('🌦️', 'Drizzle'), 61: ('🌧️', 'Rain'), 71: ('❄️', 'Snow'),
            80: ('🌦️', 'Showers'), 95: ('⛈️', 'Thunderstorm'),
        }
        icon, desc = weather_map.get(code, ('🌡️', 'Unknown'))
        temp = data.get('temperature_2m', 25)

        # Smart food suggestion based on weather
        if code >= 80:
            suggestion = "Perfect weather for hot soups & comfort food! 🍜"
        elif temp > 35:
            suggestion = "Stay cool with our refreshing beverages! 🧋"
        elif temp < 15:
            suggestion = "Warm up with our hot combos! ☕"
        else:
            suggestion = "Great day to try our signature combos! 🥗"

        return Response({
            'temperature': round(temp),
            'icon': icon,
            'description': desc,
            'windspeed': data.get('windspeed_10m', 0),
            'suggestion': suggestion,
        })
    except Exception as e:
        return Response({'temperature': 28, 'icon': '🌤️', 'description': 'Partly Cloudy',
                         'suggestion': "Order your favorite combo today! 🍔"})


# ─── Addresses ────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
def user_addresses(request):
    email = request.headers.get('X-User-Email', '')
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'Not authenticated'}, status=401)

    if request.method == 'GET':
        return Response(AddressSerializer(user.addresses.all(), many=True).data)

    elif request.method == 'POST':
        data = request.data
        if data.get('is_default'):
            user.addresses.update(is_default=False)
        addr = Address.objects.create(
            user=user,
            label=data.get('label', 'Home'),
            line1=data.get('line1', ''),
            line2=data.get('line2', ''),
            city=data.get('city', ''),
            pincode=data.get('pincode', ''),
            lat=data.get('lat'),
            lng=data.get('lng'),
            is_default=data.get('is_default', False),
        )
        return Response(AddressSerializer(addr).data, status=201)

@api_view(['GET'])
def debug_db(request):
    """Debug endpoint to verify DB and API key status."""
    from django.db import connection
    db_ok = False
    db_error = None
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception as e:
        db_ok = False
        db_error = str(e)

    # Check API keys (obfuscated)
    brevo_key = getattr(settings, 'BREVO_API_KEY', '')
    geo_key = getattr(settings, 'GEOAPIFY_KEY', '')
    
    return Response({
        'status': 'healthy' if db_ok else 'unhealthy',
        'version_timestamp': '2026-04-08_12:35_FINAL_FIX',
        'database': {
            'connected': db_ok,
            'error': db_error if not db_ok else None,
            'restaurants_count': Restaurant.objects.count(),
            'menu_items_count': MenuItem.objects.count() if db_ok else 0,
        },
        'api_keys': {
            'brevo_configured': bool(brevo_key),
            'brevo_preview': f"{brevo_key[:10]}...{brevo_key[-4:]}" if brevo_key else "MISSING",
            'geoapify_configured': bool(geo_key),
            'geoapify_preview': f"{geo_key[:10]}...{geo_key[-4:]}" if geo_key else "MISSING",
        }
    })

@api_view(['GET'])
def check_config(request):
    """
    EMERGENCY DIAGNOSTIC ENDPOINT
    Returns masked versions of loaded keys to verify environment loading.
    """
    import os
    from django.conf import settings
    
    def mask(val):
        if not val or len(val) < 8: return "MISSING/TOO_SHORT"
        return f"{val[:4]}...{val[-4:]} (len: {len(val)})"

    return Response({
        "status": "online",
        "database": settings.DATABASES['default']['ENGINE'],
        "env_path": os.path.abspath('.env'),
        "env_exists": os.path.exists('.env'),
        "keys": {
            "CASHFREE_APP_ID": mask(getattr(settings, 'CASHFREE_APP_ID', '')),
            "CASHFREE_SECRET_KEY": mask(getattr(settings, 'CASHFREE_SECRET_KEY', '')),
            "BREVO_API_KEY": mask(getattr(settings, 'BREVO_API_KEY', '')),
            "CASHFREE_MODE": getattr(settings, 'CASHFREE_MODE', 'NOT_SET')
        }
    })

@api_view(['GET'])
def get_site_config(request):
    """Expose site operational status and other public config."""
    site_online = GlobalConfig.objects.filter(key='site_online').first()
    return Response({
        'site_online': site_online.value == 'true' if site_online else True
    })
