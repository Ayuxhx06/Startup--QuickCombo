# Generated manually
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_coupon_order_applied_coupon_order_cashfree_order_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='categories',
            field=models.ManyToManyField(blank=True, related_name='restaurants', to='api.category'),
        ),
    ]
