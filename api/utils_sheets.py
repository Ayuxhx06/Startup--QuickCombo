import gspread
from google.oauth2.service_account import Credentials
import os
from django.utils import timezone
from django.conf import settings
from decouple import config

# --- CONFIGURATION ---
SHEET_ID = config('GOOGLE_SHEET_ID', default='')
CREDENTIALS_PATH = os.path.join(settings.BASE_DIR, 'api', 'service_account.json')

# Scopes required for Sheets and Drive
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

def log_message(msg):
    log_path = os.path.join(settings.BASE_DIR, 'tmp', 'sheets_log.txt')
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(f"{timezone.now()} - {msg}\n")

log_message("Utils Sheets module loaded.")

def append_order_to_sheet(order):
    """
    Appends a new order row to the Google Sheet.
    Data format:
    [Name, Email, Phone, # Items, Items List, Notes, Original Price (Blank), Selling Price (Blank), Profit (Blank)]
    """
    try:
        # 1. Authenticate
        if not os.path.exists(CREDENTIALS_PATH):
            print(f"Error: Credentials file not found at {CREDENTIALS_PATH}")
            return False

        creds = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=SCOPES)
        client = gspread.authorize(creds)

        # 2. Open the Sheet
        # If SHEET_ID is still the placeholder, this will fail. 
        # The user needs to provide the ID.
        try:
            sheet = client.open_by_key(SHEET_ID).sheet1
        except Exception as e:
            print(f"Error opening sheet: {e}")
            return False

        # 3. Prepare Data
        all_items = order.items.all()
        
        # Separate regular food items (with menu_item) from special requests (without menu_item)
        food_items = [i for i in all_items if i.menu_item is not None]
        special_req_items = [i for i in all_items if i.menu_item is None]

        food_list_str = ", ".join([f"{item.name} (x{item.quantity})" for item in food_items])
        
        # Combine special request items and general order notes
        special_req_list = [f"{item.name} (x{item.quantity})" for item in special_req_items]
        if order.notes:
            special_req_list.append(f"Instruction: {order.notes}")
        
        special_req_str = " | ".join(special_req_list)
        
        total_items_count = sum([item.quantity for item in all_items])

        row = [
            order.user_name,
            order.user_email,
            order.user_phone,
            total_items_count,
            food_list_str,
            special_req_str, # This goes into the "Special Request" column (previously Notes)
            "", # Original Price (Manual)
            "", # Selling Price (Manual)
            ""  # Profit (Manual)
        ]

        # 4. Append Row
        sheet.append_row(row)
        log_message(f"Successfully added order {order.id} to Google Sheet.")
        return True

    except Exception as e:
        log_message(f"Google Sheets API Error for Order {order.id}: {e}")
        return False
