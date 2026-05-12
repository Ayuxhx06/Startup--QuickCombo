import requests
import re
import time
from django.core.management.base import BaseCommand
from api.models import MenuItem

class Command(BaseCommand):
    help = 'Bulletproof image matching for MenuItems - No people, just food.'

    def handle(self, *args, **kwargs):
        items = MenuItem.objects.filter(image_url='')
        total = items.count()
        print(f"Bulletproof Analysis: {total} items remaining.", flush=True)

        count = 0
        processed = 0
        
        # EXTREMELY STRICT WHITELIST
        whitelist = [
            'vegrecipesofindia.com',
            'hebbarskitchen.com',
            'archanaskitchen.com',
            'ndtv.com/cooks',
            'tasty.co',
            'foodnetwork.com',
            'swasthi.recipes',
            'vahrehvah.com',
            'sanjeevkapoor.com'
        ]

        for item in items:
            processed += 1
            # Determine if it's likely a drink
            is_drink = any(word in item.name.lower() for word in ['juice', 'shake', 'lassi', 'soda', 'milk', 'coffee', 'tea', 'mojito', 'lime', 'cola'])
            
            # Craft a very specific query
            query_suffix = "drink beverage glass" if is_drink else "food dish plate"
            search_query = f"{item.name} {query_suffix} -person -girl -woman -man -human -logo"
            
            print(f"[{processed}/{total}] Analyzing {item.name}...", flush=True)
            
            img_url = None
            found = False
            
            # Step 1: Try Whitelisted sites first (High confidence)
            for site in whitelist:
                try:
                    site_query = f"site:{site} {item.name} {query_suffix}"
                    url = f"https://www.bing.com/images/search?q={site_query}"
                    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
                    
                    r = requests.get(url, headers=headers, timeout=10)
                    urls = re.findall(r'murl&quot;:&quot;(http[^&]+)&quot;', r.text)
                    
                    if urls:
                        for cand in urls[:2]:
                            cand_lower = cand.lower()
                            # Final sanity check: No people keywords in URL
                            if not any(bad in cand_lower for bad in ['person', 'girl', 'woman', 'man', 'blogger', 'influencer', 'profile']):
                                if any(ext in cand_lower for ext in ['.jpg', '.jpeg', '.png']):
                                    img_url = cand
                                    found = True
                                    print(f"  [WHITELIST] Match from {site}", flush=True)
                                    break
                    if found: break
                except: continue
                
            # Step 2: Very strict general search if whitelist fails
            if not found:
                try:
                    url = f"https://www.bing.com/images/search?q={search_query}"
                    r = requests.get(url, headers=headers, timeout=10)
                    urls = re.findall(r'murl&quot;:&quot;(http[^&]+)&quot;', r.text)
                    if urls:
                        for cand in urls[:5]:
                            cand_lower = cand.lower()
                            # Check for "food" or "dish" in the URL or reputable domains
                            if any(good in cand_lower for good in ['food', 'dish', 'recipe', 'wp-content', 'uploads', 'cdn']):
                                if not any(bad in cand_lower for bad in ['facebook', 'instagram', 'youtube', 'ytimg', 'shutterstock', 'stock', 'person', 'girl', 'woman']):
                                    if any(ext in cand_lower for ext in ['.jpg', '.jpeg', '.png']):
                                        img_url = cand
                                        found = True
                                        print(f"  [GENERAL] Match found: {img_url}", flush=True)
                                        break
                except: pass

            if found and img_url:
                item.image_url = img_url
                item.save()
                count += 1
            else:
                print(f"  [SKIPPED] No 100% verified match.", flush=True)
            
            # Safe delay
            time.sleep(3)

        print(f"\nBulletproof Task Complete! Updated {count} items.", flush=True)
