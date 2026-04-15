import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from django.db import connection

def create_table():
    with connection.cursor() as cursor:
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_restaurant_categories (
            id serial NOT NULL PRIMARY KEY,
            restaurant_id bigint NOT NULL REFERENCES api_restaurant (id) DEFERRABLE INITIALLY DEFERRED,
            category_id bigint NOT NULL REFERENCES api_category (id) DEFERRABLE INITIALLY DEFERRED,
            CONSTRAINT api_restaurant_categories_restaurant_id_category_id_uniq UNIQUE (restaurant_id, category_id)
        );
        ''')
    print("Table created successfully")

if __name__ == '__main__':
    create_table()
