from django.urls import path
from . import views
from . import admin_views
from . import views_payment

urlpatterns = [
    # ADMIN DASHBOARD (TOP PRIORITY)
    path('admin/stats/', admin_views.admin_stats),
    path('admin/orders/', admin_views.admin_orders),
    path('admin/menu/', admin_views.admin_menu_items),
    path('admin/categories/', admin_views.admin_categories),
    path('admin/restaurants/', admin_views.admin_restaurants),
    path('admin/coupons/', admin_views.admin_coupons),
    path('admin/users/', admin_views.admin_users),
    path('admin/combos/', admin_views.admin_combos),
    path('admin/bulk-import/', admin_views.admin_bulk_import),
    path('admin/upload-image/', admin_views.admin_upload_image),
    path('admin/clear-cache/', admin_views.admin_clear_cache),
    path('admin/version/', admin_views.admin_version),
    path('admin/toggle-site/', admin_views.admin_toggle_site),

    # Auth
    path('auth/send-otp/', views.send_otp),
    path('auth/verify-otp/', views.verify_otp),

    # User
    path('user/profile/', views.user_profile),
    path('user/addresses/', views.user_addresses),

    # Menu
    path('menu/', views.menu_list),
    path('menu/<int:pk>/', views.menu_item_detail),
    path('categories/', views.categories_list),
    path('restaurants/', views.restaurant_list),
    path('combos/', views.combo_list),

    # Coupons
    path('coupons/', views.public_coupons),
    path('coupons/validate/', views.validate_coupon),

    # Orders
    path('orders/', views.order_list),
    path('orders/active/', views.active_order),
    path('orders/place/', views.place_order),
    path('orders/<int:order_id>/', views.order_detail),
    path('orders/<int:order_id>/tracking/', views.order_tracking),
    path('debug-db/', views.debug_db),
    path('check-config/', views.check_config),
    path('config/', views.get_site_config),

    # Location
    path('location/autocomplete/', views.location_autocomplete),
    path('location/reverse/', views.reverse_geocode),

    # Weather
    path('weather/', views.weather),

    # Payments (Cashfree)
    path('payment/create-session/', views_payment.create_payment_session),
    path('payment/webhook/', views_payment.cashfree_webhook),
]
