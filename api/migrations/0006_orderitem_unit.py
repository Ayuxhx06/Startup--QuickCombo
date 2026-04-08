from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_order_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='unit',
            field=models.CharField(default='piece', max_length=20),
        ),
    ]
