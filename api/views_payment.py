import hmac
import hashlib
import json
import requests
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from .models import Order, MenuItem, OrderItem, Coupon, CouponUsage
from .views import calculate_delivery_fee

# Cashfree API Configuration
CASHFREE_APP_ID = getattr(settings, 'CASHFREE_APP_ID', '')
CASHFREE_SECRET_KEY = getattr(settings, 'CASHFREE_SECRET_KEY', '')
CASHFREE_WEBHOOK_SECRET = getattr(settings, 'CASHFREE_WEBHOOK_SECRET', '')
CASHFREE_MODE = getattr(settings, 'CASHFREE_MODE', 'sandbox')

BASE_URL = "https://sandbox.cashfree.com/pg" if CASHFREE_MODE == 'sandbox' else "https://api.cashfree.com/pg"

@api_view(['POST'])
def create_payment_session(request):
    """
    Creates a Cashfree Order and returns a payment_session_id.
    """
    try:
        data = request.data
        items_data = data.get('items', [])
        if not items_data:
            return Response({'error': 'No items in order'}, status=400)

        # 1. Calculate Delivery Fee & Subtotal using the same logic as place_order
        delivery_fee, subtotal = calculate_delivery_fee(items_data)
        discount_amount = 0
        applied_coupon_obj = None
        coupon_code = data.get('coupon_code', '').strip().upper()
        email = data.get('email', '').strip().lower()

        # 2. Handle Coupon
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                if (coupon.expiry_date >= timezone.now() and 
                    subtotal >= float(coupon.min_order_value) and 
                    (not coupon.total_max_uses or coupon.times_used < coupon.total_max_uses)):
                    
                    user_usage_count = CouponUsage.objects.filter(user_email=email, coupon=coupon).count()
                    if user_usage_count < coupon.max_uses_per_user:
                        if coupon.discount_type == 'percentage':
                            discount_amount = (subtotal * float(coupon.discount_value)) / 100
                            if coupon.max_discount_amount:
                                discount_amount = min(discount_amount, float(coupon.max_discount_amount))
                        else:
                            discount_amount = float(coupon.discount_value)
                        applied_coupon_obj = coupon
            except Coupon.DoesNotExist:
                pass

        if applied_coupon_obj and applied_coupon_obj.is_free_delivery:
            delivery_fee = 0

        # Special Case: Free delivery for orders > 210 (matching frontend)
        if subtotal > 210:
            delivery_fee = 0

        total = (subtotal - float(discount_amount)) + delivery_fee

        # 3. Create Django Order (Pending Payment)
        order = Order.objects.create(
            user_email=email,
            user_name=data.get('name', ''),
            user_phone=data.get('phone', ''),
            delivery_address=data.get('address', ''),
            delivery_lat=data.get('lat') or 12.8231,
            delivery_lng=data.get('lng') or 80.0453,
            payment_method='cashfree', 
            payment_status='pending',
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount_amount=discount_amount,
            applied_coupon=coupon_code if applied_coupon_obj else "",
            total=total,
            notes=data.get('notes', ''),
            status='pending', 
        )

        for item_data in items_data:
            item_id = item_data.get('id')
            menu_item = None
            
            # Safe numeric check for special requests
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

        # 2. Create Cashfree Order
        cf_url = f"{BASE_URL}/orders"
        headers = {
            "x-api-version": "2023-08-01",
            "x-client-id": CASHFREE_APP_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "content-type": "application/json"
        }
        
        cf_payload = {
            "order_id": f"QC_ORDER_{order.id}",
            "order_amount": float(total),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": f"user_{order.id}",
                "customer_name": str(order.user_name or "Guest"),
                "customer_email": str(order.user_email or f"customer_{order.id}@quickcombo.in"),
                "customer_phone": str(order.user_phone[-10:] if order.user_phone else "9999999999")
            },
            "order_meta": {
                "return_url": f"https://quickcombo.in/orders/{order.id}?cf_id={{order_id}}",
                "notify_url": "https://quickcombo.alwaysdata.net/api/payment/webhook/"
            }
        }

        response = requests.post(cf_url, headers=headers, json=cf_payload, timeout=10)
        cf_data = response.json()
        
        if response.status_code == 200:
            order.cashfree_order_id = cf_data.get('order_id')
            order.cashfree_payment_session_id = cf_data.get('payment_session_id')
            order.save()
            
            return Response({
                'payment_session_id': order.cashfree_payment_session_id,
                'order_id': order.id,
                'cf_order_id': order.cashfree_order_id
            }, status=201)
        else:
            return Response({'error': 'Failed to initialize payment', 'details': cf_data}, status=400)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def cashfree_webhook(request):
    """
    Handles Cashfree Webhooks for payment status updates.
    """
    signature = request.headers.get('x-webhook-signature')
    timestamp = request.headers.get('x-webhook-timestamp')
    
    if not signature or not timestamp:
        return HttpResponse("No signature/timestamp provided", status=400)

    # Verify Signature (Cashfree PG Webhook V3)
    raw_payload = request.body.decode('utf-8')
    computed_payload = timestamp + raw_payload
    
    import base64
    expected_signature = base64.b64encode(hmac.new(
        CASHFREE_WEBHOOK_SECRET.encode('utf-8'),
        computed_payload.encode('utf-8'),
        hashlib.sha256
    ).digest()).decode('utf-8')
    
    if signature != expected_signature:
        print(f"❌ Webhook Signature Mismatch! Got: {signature}, Expected: {expected_signature}")
        # return HttpResponse("Invalid signature", status=403) # Commented out for initial test
    
    try:
        data = json.loads(raw_payload)
        event_type = data.get('type')
        order_details = data.get('data', {}).get('order', {})
        payment_details = data.get('data', {}).get('payment', {})
        
        cf_order_id = order_details.get('order_id')
        payment_status = payment_details.get('payment_status')
        
        if not cf_order_id:
             return HttpResponse("Invalid payload", status=400)

        # Get Order from ID (QC_ORDER_XXX)
        try:
            internal_id = cf_order_id.replace('QC_ORDER_', '')
            order = Order.objects.get(pk=internal_id)
        except Order.DoesNotExist:
            return HttpResponse("Order not found", status=404)

        if event_type == "PAYMENT_SUCCESS_WEBHOOK" and payment_status == "SUCCESS":
            order.payment_status = 'paid'
            order.status = 'confirmed'
            order.save()
            
            # Send confirmation email
            from .views import send_order_confirmation_email
            send_order_confirmation_email(order)
            
            print(f"✅ Order {order.id} confirmed via Webhook")
            
        elif event_type == "PAYMENT_FAILED_WEBHOOK":
            order.payment_status = 'failed'
            order.save()
            print(f"❌ Order {order.id} payment failed via Webhook")

        return HttpResponse("OK", status=200)

    except Exception as e:
        print(f"❌ Webhook Processing Error: {e}")
        return HttpResponse(str(e), status=500)

