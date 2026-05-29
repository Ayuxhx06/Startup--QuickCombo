import json
import os
import google.generativeai as genai
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import MenuItem
from .serializers import MenuItemSerializer

# Configure Gemini (will use GEMINI_API_KEY from environment or settings)
API_KEY = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))
if API_KEY:
    genai.configure(api_key=API_KEY)

@api_view(['POST'])
def qiqi_chat(request):
    """
    Qiqi AI Chatbot endpoint for QuickCombo.
    Expects: { "message": "I'm feeling sad", "history": [...] }
    """
    if not API_KEY:
        return Response({'error': 'GEMINI_API_KEY is not configured on the server.'}, status=500)

    user_message = request.data.get('message', '').strip()
    history = request.data.get('history', [])

    if not user_message:
        return Response({'error': 'Message is required'}, status=400)

    # 1. Fetch Context Data (Menu Items)
    items_qs = MenuItem.objects.filter(is_available=True, is_combo_eligible=True).select_related('restaurant', 'category')
    menu_context = []
    for item in items_qs:
        menu_context.append({
            "id": item.id,
            "name": item.name,
            "price": float(item.price),
            "restaurant": item.restaurant.name if item.restaurant else "QuickCombo",
            "category": item.category.name if item.category else "",
            "is_veg": item.is_veg
        })

    # 2. Build the System Prompt
    system_instruction = f"""You are Qiqi, an empathetic, friendly, and food-loving AI chatbot for the food delivery app "QuickCombo".
Your job is to recommend custom food combos to users based on their mood, cravings, or current situation.
Be brief, warm, and highly conversational. Keep your text response under 3 sentences.

CRITICAL RULE: If the user tells you their mood or asks for food, but HAS NOT specified their food preference yet (e.g. they haven't mentioned if they want veg, non-veg, sweet, or savoury), DO NOT suggest combos immediately. 
Instead, ask them to choose from the following preferences:
1. Veg
2. Non-veg
3. Sweet
4. Savoury
5. Both
WHEN YOU DO THIS, YOU MUST INCLUDE the exact `options` array shown below in your JSON output!
(If you are asking this, leave `dynamic_combos` as an empty array).

Once you know their preference (or if they already mentioned it), analyze their message and create 1 to 2 "Dynamic Custom Combos" by picking complementary items from the list below.
Whenever possible, try to pair a main food item with a drink or beverage (like Coke) to make a complete meal combo.
Give each combo a fun, creative name.
Return your response in strictly valid JSON format.
DO NOT use markdown code blocks like ```json ... ```, just output the raw JSON object.

Here is the current list of available menu items:
{json.dumps(menu_context)}

Your JSON must match this structure exactly:
{{
  "reply": "A friendly message explaining why you created these combos based on their mood, or asking for their preference if not provided.",
  "options": ["Veg", "Non-veg", "Sweet", "Savoury", "Both"], 
  "dynamic_combos": [
    {{
      "combo_name": "The Stress Buster Combo",
      "description": "Fries and a cold drink to wash the stress away!",
      "item_ids": [1, 5]
    }}
  ]
}}
"""

    # 3. Initialize Model
    model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

    # 4. Build Chat History
    formatted_history = []
    for msg in history:
        # Map frontend roles ('user', 'qiqi') to Gemini roles ('user', 'model')
        role = 'model' if msg.get('role') == 'qiqi' else 'user'
        content = msg.get('content', '')
        if content:
            formatted_history.append({"role": role, "parts": [content]})

    # 5. Generate Response
    try:
        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(user_message)
        response_text = response.text.strip()
        
        # Clean up any markdown blocks if the model disobeys instructions
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Extract the JSON block if the model outputs text before/after the JSON
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
            response_text = response_text[start_idx:end_idx+1]

        try:
            ai_data = json.loads(response_text)
        except json.JSONDecodeError:
            print(f"[Qiqi] JSON Parse Error. Raw: {response_text}")
            return Response({'error': 'Failed to parse AI response', 'raw': response_text}, status=500)

        # 6. Construct full dynamic combos for the frontend
        frontend_combos = []
        raw_combos = ai_data.get('dynamic_combos', [])
        
        for idx, rc in enumerate(raw_combos):
            item_ids = rc.get('item_ids', [])
            db_items = MenuItem.objects.filter(id__in=item_ids)
            serialized_items = MenuItemSerializer(db_items, many=True).data
            
            # Calculate total price
            total_price = sum(float(item['price']) for item in serialized_items)
            
            frontend_combos.append({
                "id": f"dynamic_{idx}",
                "name": rc.get('combo_name', 'Custom Combo'),
                "description": rc.get('description', ''),
                "price": f"{total_price:.2f}",
                "items": serialized_items,
                "is_dynamic": True
            })

        reply_text = ai_data.get('reply', 'I built some custom combos just for you!')
        options = ai_data.get('options', [])
        
        # Fallback: if Gemini forgets to output the options array but asks for preference
        lower_reply = reply_text.lower()
        if not options and ('veg' in lower_reply or 'savoury' in lower_reply or 'sweet' in lower_reply):
            options = ["Veg", "Non-veg", "Sweet", "Savoury", "Both"]

        return Response({
            'reply': reply_text,
            'options': options,
            'suggested_combos': frontend_combos
        })

    except Exception as e:
        print(f"[Qiqi] API Error: {str(e)}")
        return Response({'error': str(e)}, status=500)
