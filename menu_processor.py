import csv
import json
import os
import asyncio
import aiohttp
import time
import random
import cloudinary
import cloudinary.uploader
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "your_cloud_name"), # I still need this!
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Constants
KEYWORDS_TO_REMOVE = ["special", "combo", "delight", "offer"]
CATEGORY_MAPPING = {
    "biryani": ["biryani", "pulao", "rice"],
    "south_indian": ["dosa", "idli", "vada"],
    "fastfood": ["pizza", "burger", "fries"],
    "chinese": ["noodles", "manchurian", "chinese"],
    "rolls": ["roll", "wrap", "shawarma"],
    "north_indian": ["paneer", "dal", "curry"],
    "beverages": ["juice", "shake", "coffee", "tea"]
}

# Image Cache (Max 10 per category)
image_cache = {} # {category: [cloudinary_urls]}
CACHE_DIR = "images"

if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def cleanData(name, category=""):
    name = name.lower().strip()
    category = category.lower().strip() if category else ""
    
    # Remove words
    for word in KEYWORDS_TO_REMOVE:
        name = name.replace(word, "").strip()
    
    # Normalize category
    category = category.replace(" ", "_")
    
    return name, category

def detectCategory(name, category):
    # Try keyword match using Name
    for cat, keywords in CATEGORY_MAPPING.items():
        if any(kw in name for kw in keywords):
            return cat
            
    # If not found, use normalized Category
    if category:
        for cat, keywords in CATEGORY_MAPPING.items():
            if any(kw in category for kw in keywords):
                return cat
                
    return "default"

async def downloadImage(session, category):
    # Check cache first
    if category in image_cache and len(image_cache[category]) >= 10:
        return random.choice(image_cache[category])
        
    # Using LoremFlickr as Unsplash Source is deprecated and unstable
    url = f"https://loremflickr.com/600/400/food,{category}/all"
    timestamp = int(time.time() * 1000)
    local_path = os.path.join(CACHE_DIR, f"{category}_{timestamp}.jpg")
    
    try:
        async with session.get(url, timeout=15) as response:
            if response.status == 200:
                content = await response.read()
                with open(local_path, "wb") as f:
                    f.write(content)
                
                # Upload to Cloudinary (blocking call, run in thread)
                upload_result = await asyncio.to_thread(
                    cloudinary.uploader.upload, 
                    local_path, 
                    folder="menu_items"
                )
                cloudinary_url = upload_result.get("secure_url")
                
                # Update Cache
                if category not in image_cache:
                    image_cache[category] = []
                image_cache[category].append(cloudinary_url)
                
                return cloudinary_url
            else:
                print(f"Failed to download image for {category}: {response.status}")
                return "https://via.placeholder.com/300?text=Food"
    except Exception as e:
        print(f"Error processing image for {category}: {str(e)}")
        return "https://via.placeholder.com/300?text=Food"

async def processItems(items_data):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for item in items_data:
            tasks.append(downloadImage(session, item['category']))
        
        image_urls = await asyncio.gather(*tasks)
        
        for i, item in enumerate(items_data):
            item['image'] = image_urls[i]
            
        return items_data

def processCSV(csv_path):
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return
        
    print(f"Processing CSV: {csv_path}...")
    items_to_process = []
    
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Handle different CSV headers (user's export vs original requirement)
            raw_name = row.get('Name') or row.get('name')
            raw_cat = row.get('Category') or row.get('category')
            
            if not raw_name: continue
            
            name, category = cleanData(raw_name, raw_cat)
            detected_cat = detectCategory(name, category)
            
            items_to_process.append({
                "id": row.get('ID') or row.get('id'),
                "name": name,
                "category": detected_cat
            })
            
    # Run async processing
    processed_menu = asyncio.run(processItems(items_to_process))
    
    # Save to JSON
    output_path = "processed_menu.json"
    with open(output_path, "w", encoding='utf-8') as f:
        json.dump(processed_menu, f, indent=2)
        
    print(f"Production Ready Menu generated: {output_path}")
    return processed_menu

if __name__ == "__main__":
    # Test with the export file we just created
    processCSV("all_items_export.csv")
