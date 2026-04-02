from django.urls import path
from . import views

urlpatterns = [
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

    # Orders
    path('orders/', views.order_list),
    path('orders/active/', views.active_order),
    path('orders/place/', views.place_order),
    path('orders/<int:order_id>/', views.order_detail),
    path('orders/<int:order_id>/tracking/', views.order_tracking),

    # Location
    path('location/autocomplete/', views.location_autocomplete),
    path('location/reverse/', views.reverse_geocode),

    # Weather
    path('weather/', views.weather),
]
