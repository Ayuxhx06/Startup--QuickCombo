from django.contrib import admin
from .models import User, Category, MenuItem, Address, Order, OrderItem, Restaurant, PredefinedCombo

class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'name', 'phone')

class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'category', 'is_veg', 'is_featured', 'rating', 'prep_time')
    list_filter = ('category', 'is_veg', 'is_featured')
    search_fields = ('name', 'description')

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'rating', 'is_active')
    filter_horizontal = ('categories',)

class PredefinedComboAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price', 'is_active', 'created_at')
    filter_horizontal = ('items',)
    search_fields = ('name', 'description')

admin.site.register(User, UserAdmin)
admin.site.register(Category)
admin.site.register(MenuItem, MenuItemAdmin)
admin.site.register(Restaurant, RestaurantAdmin)
admin.site.register(Address)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)
admin.site.register(PredefinedCombo, PredefinedComboAdmin)
