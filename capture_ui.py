import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    out_dir = r"C:\Users\tarul\.gemini\antigravity\brain\15a01559-11fd-4f70-ac8d-e35ad5008574"
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # Navigate to local server
        await page.goto("http://127.0.0.1:8000")
        await page.wait_for_selector(".matrix-cell-title")
        await asyncio.sleep(1)

        # 1. Dark Mode Scenarios
        await page.screenshot(path=os.path.join(out_dir, "verified_dark_scenarios.png"))
        print("Captured dark mode")

        # 2. Toggle to Light Mode
        theme_btn = await page.query_selector("#themeToggleBtn")
        if theme_btn:
            await theme_btn.click()
            await asyncio.sleep(0.5)
        
        # Light Mode Scenarios
        await page.screenshot(path=os.path.join(out_dir, "verified_light_scenarios.png"))
        print("Captured light mode")

        # 3. Play a duel round in light mode
        coop_btn = await page.query_selector("#btnDuelAct0")
        if coop_btn:
            await coop_btn.click()
            await asyncio.sleep(0.5)
            await coop_btn.click()
            await asyncio.sleep(0.5)
        
        await page.screenshot(path=os.path.join(out_dir, "verified_light_duel.png"))
        print("Captured light mode duel")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
