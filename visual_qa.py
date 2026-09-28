import os
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Setup Artifacts dir
ARTIFACTS_DIR = r"C:\Users\Admin\.gemini\antigravity-ide\brain\7e31eeaf-37e3-43de-a35c-f6ca2a297349"

options = Options()
# Intentionally NOT using --headless so the browser is fully visible to the user
options.add_experimental_option("excludeSwitches", ["enable-automation"])

def take_screenshot(driver, name):
    path = os.path.join(ARTIFACTS_DIR, f"{name}.png")
    driver.save_screenshot(path)
    print(f"Captured: {name}")

def run_visual_qa():
    driver = webdriver.Chrome(options=options)
    try:
        # 1. 1440x900 Tests
        driver.set_window_size(1440, 900)
        
        # Test Home
        driver.get("http://localhost:3000/index.html")
        time.sleep(2)
        take_screenshot(driver, "visual_home_1440")
        
        # Test Leadership
        driver.get("http://localhost:3000/leadership.html")
        time.sleep(3)
        take_screenshot(driver, "visual_leadership_1440")
        members = driver.find_elements(By.CSS_SELECTOR, "h3")
        leadership_names = [m.text for m in members if m.text.strip()]
        
        # Test Team
        driver.get("http://localhost:3000/team.html")
        time.sleep(3)
        take_screenshot(driver, "visual_team_1440")
        members = driver.find_elements(By.CSS_SELECTOR, "h3")
        team_names = [m.text for m in members if m.text.strip()]
        
        # Test About
        driver.get("http://localhost:3000/about.html")
        time.sleep(2)
        take_screenshot(driver, "visual_about_1440")
        
        # Test FAQ interactions
        driver.get("http://localhost:3000/faq.html")
        time.sleep(2)
        take_screenshot(driver, "visual_faq_closed")
        buttons = driver.find_elements(By.CSS_SELECTOR, "button.flex")
        if buttons:
            buttons[0].click()
            time.sleep(1)
            take_screenshot(driver, "visual_faq_open")

        # Events Filters
        driver.get("http://localhost:3000/events.html")
        time.sleep(3)
        filter_btns = driver.find_elements(By.CSS_SELECTOR, ".event-filter-btn")
        if len(filter_btns) > 1:
            filter_btns[1].click()
            time.sleep(1)
            take_screenshot(driver, "visual_events_filtered")
        
        # 2. Viewport Checks (using About page as it had contrast issues)
        driver.get("http://localhost:3000/about.html")
        
        viewports = [(1280, 800), (1024, 768), (768, 1024), (390, 844), (375, 812)]
        for w, h in viewports:
            driver.set_window_size(w, h)
            time.sleep(1)
            take_screenshot(driver, f"visual_viewport_{w}x{h}")
            
        # 3. Data dump
        data = {
            "leadership_rendered": leadership_names,
            "team_rendered": team_names
        }
        with open(os.path.join(ARTIFACTS_DIR, "visual_qa_data.json"), "w") as f:
            json.dump(data, f, indent=2)
            
        print("Visual QA complete.")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    run_visual_qa()
