import json
from pywebpush import webpush, WebPushException

def send_rider_push_notification(order):
    from .models import RiderPushSubscription, OrderItem
    
    # Get restaurant name from the first item
    first_item = order.items.first()
    restaurant_name = 'QuickCombo Store'
    if first_item and first_item.menu_item and first_item.menu_item.restaurant:
        restaurant_name = first_item.menu_item.restaurant.name

    # Payload data
    payload = {
        'title': 'New QuickCombo Order! 🛵',
        'body': f'Order #{order.id} from {restaurant_name} is available. Tap to view.',
        'order_id': order.id,
        'restaurant': restaurant_name
    }
    
    # Fetch all push subscriptions
    subscriptions = RiderPushSubscription.objects.all()
    
    # VAPID keys
    vapid_private_key = "R-B-5LkOM1DYo1nih2fbHwQdmlz6p8LA6JUQ9T2fwIg"
    vapid_claims = {
        "sub": "mailto:support@quickcombo.com"
    }
    
    print(f"Triggering background Web Push for Order #{order.id} to {subscriptions.count()} riders...")
    
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "auth": sub.auth_key,
                "p256dh": sub.p256dh_key
            }
        }
        
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims
            )
            print(f"Background Web Push sent successfully to {sub.user.email}")
        except WebPushException as ex:
            # If subscription is expired or invalid, delete it
            print(f"Failed to send Web Push to {sub.user.email}: {ex}")
            if ex.response is not None and ex.response.status_code in [404, 410]:
                try:
                    sub.delete()
                    print(f"Deleted expired subscription for {sub.user.email}")
                except Exception as del_err:
                    print(f"Failed to delete expired subscription: {del_err}")
        except Exception as e:
            print(f"Error sending Web Push to {sub.user.email}: {e}")
