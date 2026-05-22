import json
from pywebpush import webpush, WebPushException

# VAPID keys (same pair used for both rider & admin subscriptions)
VAPID_PRIVATE_KEY = "R-B-5LkOM1DYo1nih2fbHwQdmlz6p8LA6JUQ9T2fwIg"
VAPID_PUBLIC_KEY  = "BFspP4ge4f7UZpmvvDQcm280ZlLm9WjYp_Z5COtyb8eOaFGtQAQR0MAGCllsOUqwDn2FnW5x2_NGnIi0PqC7C0U"
VAPID_CLAIMS = {"sub": "mailto:support@quickcombo.in"}


def _send_push(endpoint, auth_key, p256dh_key, payload: dict, label: str = ""):
    """Low-level helper: send a single Web Push notification."""
    subscription_info = {
        "endpoint": endpoint,
        "keys": {
            "auth": auth_key,
            "p256dh": p256dh_key,
        }
    }
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        print(f"✅ Web Push sent to {label or endpoint[:30]}")
        return True
    except WebPushException as ex:
        print(f"❌ WebPushException for {label or endpoint[:30]}: {ex}")
        return "expired" if (ex.response is not None and ex.response.status_code in [404, 410]) else False
    except Exception as e:
        print(f"❌ Push error for {label or endpoint[:30]}: {e}")
        return False


# ─── Rider Push ───────────────────────────────────────────────────────────────

def send_rider_push_notification(order):
    from .models import RiderPushSubscription

    first_item = order.items.first()
    restaurant_name = "QuickCombo Store"
    if first_item and first_item.menu_item and first_item.menu_item.restaurant:
        restaurant_name = first_item.menu_item.restaurant.name

    items_list = ", ".join(
        f"{i.quantity}x {i.name}" for i in order.items.all()
    ) or "No items"

    payload = {
        "title": "New QuickCombo Order! 🛵",
        "body": f"Order #{order.id} from {restaurant_name} — {items_list}. Tap to view.",
        "order_id": order.id,
        "restaurant": restaurant_name,
        "type": "new_order",
        "url": "/rider/dashboard",
    }

    subscriptions = RiderPushSubscription.objects.all()
    print(f"🔔 Rider Push → Order #{order.id} → {subscriptions.count()} riders")

    to_delete = []
    for sub in subscriptions:
        result = _send_push(sub.endpoint, sub.auth_key, sub.p256dh_key, payload, label=sub.user.email)
        if result == "expired":
            to_delete.append(sub.pk)

    if to_delete:
        RiderPushSubscription.objects.filter(pk__in=to_delete).delete()
        print(f"🗑️ Deleted {len(to_delete)} expired rider subscriptions")


# ─── Admin Push ───────────────────────────────────────────────────────────────

def send_admin_new_order_push(order):
    """Push to all admin subscriptions when a new order is placed."""
    from .models import AdminPushSubscription

    items_lines = []
    shops = set()
    for item in order.items.all():
        items_lines.append(f"{item.quantity}x {item.name} (₹{item.price})")
        if item.menu_item and item.menu_item.restaurant:
            shops.add(item.menu_item.restaurant.name)

    items_str = ", ".join(items_lines) or "No items"
    shops_str = " | ".join(shops) if shops else "QuickCombo Store"

    body = (
        f"#{order.id} • {order.user_name} • 📞 {order.user_phone}\n"
        f"📍 {order.delivery_address}\n"
        f"🛍️ {items_str}\n"
        f"🏪 {shops_str}\n"
        f"💰 ₹{order.total} via {order.get_payment_method_display()}"
    )

    payload = {
        "title": f"🛍️ New Order #{order.id} Received!",
        "body": body,
        "order_id": order.id,
        "type": "admin_new_order",
        "url": "/admin",
        # Short version for notification preview
        "tag": f"new-order-{order.id}",
    }

    subscriptions = AdminPushSubscription.objects.all()
    print(f"🔔 Admin New-Order Push → Order #{order.id} → {subscriptions.count()} admin sessions")

    to_delete = []
    for sub in subscriptions:
        result = _send_push(sub.endpoint, sub.auth_key, sub.p256dh_key, payload, label="Admin")
        if result == "expired":
            to_delete.append(sub.pk)

    if to_delete:
        AdminPushSubscription.objects.filter(pk__in=to_delete).delete()
        print(f"🗑️ Deleted {len(to_delete)} expired admin subscriptions")


def send_admin_rider_accepted_push(order, rider):
    """Push to all admin subscriptions when a rider accepts an order."""
    from .models import AdminPushSubscription

    body = (
        f"Rider {rider.name or rider.email} (📞 {rider.phone or 'N/A'}) "
        f"accepted Order #{order.id}.\n"
        f"Status: {order.get_status_display()} • ₹{order.total}"
    )

    payload = {
        "title": f"🛵 Rider Accepted Order #{order.id}",
        "body": body,
        "order_id": order.id,
        "rider_name": rider.name or rider.email,
        "type": "admin_rider_accepted",
        "url": "/admin",
        "tag": f"rider-accepted-{order.id}",
    }

    subscriptions = AdminPushSubscription.objects.all()
    print(f"🔔 Admin Rider-Accepted Push → Order #{order.id} → {subscriptions.count()} admin sessions")

    to_delete = []
    for sub in subscriptions:
        result = _send_push(sub.endpoint, sub.auth_key, sub.p256dh_key, payload, label="Admin")
        if result == "expired":
            to_delete.append(sub.pk)

    if to_delete:
        AdminPushSubscription.objects.filter(pk__in=to_delete).delete()
