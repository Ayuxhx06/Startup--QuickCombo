import json
import os
import google.generativeai as genai
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from .models import PredefinedCombo, MenuItem
from .serializers import PredefinedComboSerializer, MenuItemSerializer

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

    # 1. Fetch Context Data (Combos)
    combos = PredefinedCombo.objects.filter(is_active=True)
    combo_context = []
    for c in combos:
        items = [i.name for i in c.items.all()]
        combo_context.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "price": float(c.price),
            "items": items
        })

    # 2. Build the System Prompt
    system_instruction = f"""You are Qiqi, an empathetic, friendly, and food-loving AI chatbot for the food delivery app "QuickCombo".
Your job is to recommend food combos to users based on their mood, cravings, or current situation.
Be brief, warm, and highly conversational. Keep your text response under 3 sentences.

Here is the current list of available combos in our database:
{json.dumps(combo_context, indent=2)}

You must analyze the user's message, pick 1 to 3 relevant combos from the list above, and return your response in strictly valid JSON format.
DO NOT use markdown code blocks like ```json ... ```, just output the raw JSON object.

Your JSON must match this structure exactly:
{{
  "reply": "A friendly message explaining why you picked these combos based on their mood.",
  "suggested_combo_ids": [1, 5] // Only include IDs that actually exist in the provided list. Can be empty [] if no matches.
}}
"""

    # 3. Initialize Model
    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction)

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

        try:
            ai_data = json.loads(response_text)
        except json.JSONDecodeError:
            print(f"[Qiqi] JSON Parse Error. Raw: {response_text}")
            return Response({'error': 'Failed to parse AI response'}, status=500)

        # 6. Fetch full combo objects for the frontend
        suggested_ids = ai_data.get('suggested_combo_ids', [])
        suggested_combos = PredefinedCombo.objects.filter(id__in=suggested_ids, is_active=True)
        serialized_combos = PredefinedComboSerializer(suggested_combos, many=True).data

        return Response({
            'reply': ai_data.get('reply', 'I found some options for you!'),
            'suggested_combos': serialized_combos
        })

    except Exception as e:
        print(f"[Qiqi] API Error: {str(e)}")
        return Response({'error': str(e)}, status=500)
