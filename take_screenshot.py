import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    print("Starting browser...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to http://localhost:3000/")
        await page.goto("http://localhost:3000/")
        
        # Wait for the chat button to appear
        print("Waiting for Qiqi button...")
        chat_btn = page.locator("button:has-text('✨')")
        await chat_btn.wait_for(state="visible", timeout=10000)
        await chat_btn.click()
        
        # Type a message
        print("Typing message...")
        input_field = page.locator("input[placeholder='Tell me your mood...']")
        await input_field.wait_for(state="visible")
        await input_field.fill("I'm having a bad day, suggest something heavy and comforting")
        
        # Click send
        print("Clicking send...")
        send_btn = page.locator("button:has-text('➤')")
        await send_btn.click()
        
        # Wait for Qiqi to respond (combo cards or a message bubble)
        # We wait for the loading indicator to disappear, or for a new message to appear
        print("Waiting for response...")
        await page.wait_for_timeout(6000) # Wait 6 seconds for Gemini API to return
        
        # Take a screenshot
        screenshot_path = os.path.join(r"C:\Users\Ayush Tomar\.gemini\antigravity\brain\a7d4edb1-c461-42a9-9ef1-685a05b520c1", "qiqi_proof.png")
        print(f"Taking screenshot to {screenshot_path}")
        await page.screenshot(path=screenshot_path)
        
        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
