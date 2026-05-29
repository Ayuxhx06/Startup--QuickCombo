from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
import random
import string


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    name = models.CharField(max_length=100, blank=True)
    otp = models.CharField(max_length=6, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_rider = models.BooleanField(default=False)
    vehicle_number = models.CharField(max_length=50, blank=True)
    driving_license = models.CharField(max_length=50, blank=True)
    upi_id = models.CharField(max_length=100, blank=True)
    rider_verified = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()

    def generate_otp(self):
        self.otp = ''.join(random.choices(string.digits, k=6))
        self.otp_created_at = timezone.now()
        self.save()
        return self.otp

    def __str__(self):
        return self.email


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, default='🍽️')
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Restaurant(models.Model):
    name = models.CharField(max_length=200)
    rating = models.FloatField(default=4.5)
    delivery_time = models.IntegerField(default=30)
    cuisines = models.CharField(max_length=200, help_text="e.g. North Indian, Chinese")
    image_url = models.CharField(max_length=500, blank=True, null=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    categories = models.ManyToManyField(Category, blank=True, related_name='restaurants')

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_items', null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    is_veg = models.BooleanField(default=True)
    is_available = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_combo_eligible = models.BooleanField(default=True, db_index=True)
    rating = models.FloatField(default=4.2)
    prep_time = models.IntegerField(default=20)  # minutes

    def __str__(self):
        return self.name


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50, default='Home')
    line1 = models.CharField(max_length=200)
    line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label} - {self.user.email}"


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Max ₹ off for percentage coupons")
    expiry_date = models.DateTimeField()
    max_uses_per_user = models.IntegerField(default=1)
    total_max_uses = models.IntegerField(null=True, blank=True)
    times_used = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    is_free_delivery = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_value})"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('picked_up', 'Picked Up'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_CHOICES = [
        ('upi', 'UPI'),
        ('cod', 'Cash on Delivery'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    assigned_rider = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='assigned_orders', null=True, blank=True)
    user_email = models.EmailField(blank=True)
    user_name = models.CharField(max_length=100, blank=True)
    user_phone = models.CharField(max_length=15, blank=True)
    delivery_address = models.TextField()
    delivery_lat = models.FloatField(null=True, blank=True)
    delivery_lng = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='cod')
    payment_status = models.CharField(max_length=20, default='pending')
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=40)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    applied_coupon = models.CharField(max_length=50, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Cashfree Integration
    cashfree_order_id = models.CharField(max_length=100, blank=True, null=True)
    cashfree_payment_session_id = models.CharField(max_length=255, blank=True, null=True)

    # Simulated rider location
    rider_lat = models.FloatField(null=True, blank=True)
    rider_lng = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user_email}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.IntegerField(default=1)
    unit = models.CharField(max_length=20, default='piece') # piece, kg, litre

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.name}"


class CouponUsage(models.Model):
    user_email = models.EmailField()
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user_email', 'coupon', 'order')

class GlobalConfig(models.Model):
    key = models.CharField(max_length=50, unique=True)
    value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

    class Meta:
        verbose_name = "Global Configuration"
        verbose_name_plural = "Global Configurations"

class PredefinedCombo(models.Model):
    name = models.CharField(max_length=200, help_text="e.g. IPL Match Combo")
    description = models.TextField(blank=True)
    items = models.ManyToManyField(MenuItem, related_name='combos')
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total price for the combo")
    image_url = models.CharField(max_length=500, blank=True, null=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='predefined_combos', null=True, blank=True)
    source_restaurant_name = models.CharField(max_length=200, blank=True, null=True, help_text="Manual restaurant name for display")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Predefined Combo"
        verbose_name_plural = "Predefined Combos"


class RiderPushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    auth_key = models.CharField(max_length=255)
    p256dh_key = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.endpoint[:30]}..."


class AdminPushSubscription(models.Model):
    """Stores Web Push subscriptions for the Admin panel."""
    endpoint = models.TextField(unique=True)
    auth_key = models.CharField(max_length=255)
    p256dh_key = models.CharField(max_length=255)
    label = models.CharField(max_length=100, blank=True, default='Admin Browser')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Admin - {self.endpoint[:40]}..."


class Banner(models.Model):
    """Promotional banners shown on the home page carousel."""
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    cta_text = models.CharField(max_length=50, default='Order Now')
    cta_link = models.CharField(max_length=500, help_text="e.g. /menu?category=beverages or /combo")
    image_url = models.CharField(max_length=500, blank=True)
    bg_color = models.CharField(max_length=20, default='#0a0a0a', help_text="Fallback background hex color")
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.IntegerField(default=0, help_text="Lower = shown first")
    schedule_start = models.DateTimeField(null=True, blank=True, help_text="Auto-activate from this time")
    schedule_end = models.DateTimeField(null=True, blank=True, help_text="Auto-deactivate after this time")
    impressions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def ctr(self):
        if self.impressions == 0:
            return 0
        return round((self.clicks / self.impressions) * 100, 1)

    def is_scheduled_active(self):
        now = timezone.now()
        if self.schedule_start and now < self.schedule_start:
            return False
        if self.schedule_end and now > self.schedule_end:
            return False
        return True


class GroupOrder(models.Model):
    """A shared group ordering session."""
    session_id = models.CharField(max_length=12, unique=True, db_index=True)
    creator_name = models.CharField(max_length=100)
    creator_email = models.EmailField(blank=True)
    creator_address = models.TextField(blank=True)
    creator_lat = models.FloatField(null=True, blank=True)
    creator_lng = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Group {self.session_id} by {self.creator_name}"

    def is_expired(self):
        return timezone.now() > self.expires_at


class GroupOrderItem(models.Model):
    """An item added to a group order session by a participant."""
    group_order = models.ForeignKey(GroupOrder, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, blank=True)
    item_name = models.CharField(max_length=200)
    item_price = models.DecimalField(max_digits=8, decimal_places=2)
    item_image = models.CharField(max_length=500, blank=True)
    item_is_veg = models.BooleanField(default=True)
    quantity = models.IntegerField(default=1)
    added_by = models.CharField(max_length=100)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.item_name} (by {self.added_by})"
