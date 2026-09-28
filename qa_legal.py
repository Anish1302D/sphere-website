import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Artifact dir
ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity-ide\brain\7e31eeaf-37e3-43de-a35c-f6ca2a297349"

pages = ["brand.html", "privacy.html", "terms.html"]
viewports = [
    {"name": "desktop", "width": 1440, "height": 900},
    {"name": "tablet", "width": 1024, "height": 768},
    {"name": "mobile", "width": 390, "height": 844}
]

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

try:
    driver = webdriver.Chrome(options=options)
    
    for page in pages:
        print(f"\n--- Checking {page} ---")
        driver.get(f"http://localhost:3000/{page}")
        time.sleep(1) # wait for render
        
        # 1. Console Logs
        logs = driver.get_log('browser')
        errors = [log['message'] for log in logs if log['level'] == 'SEVERE' and 'favicon.ico' not in log['message']]
        if errors:
            print(f"[FAIL] Console errors found: {errors}")
        else:
            print("[PASS] No console errors.")
            
        # 2. Check for old branding
        page_source = driver.page_source.lower()
        if "sphere coding club" in page_source:
            print("[FAIL] Found 'sphere coding club' instead of 'Sphere Community'")
        else:
            print("[PASS] No old 'Sphere Coding Club' branding.")
            
        if ">join club<" in page_source:
            print("[FAIL] Found 'Join Club' button text instead of 'Join Community'")
        else:
            print("[PASS] No 'Join Club' button.")
            
        # 3. Check Viewports & Overflow
        for vp in viewports:
            driver.set_window_size(vp["width"], vp["height"])
            time.sleep(0.5)
            
            # Check overflow
            has_overflow = driver.execute_script("return document.documentElement.scrollWidth > window.innerWidth;")
            if has_overflow:
                print(f"[FAIL] Horizontal overflow detected at {vp['name']} ({vp['width']}px)")
            else:
                print(f"[PASS] No overflow at {vp['name']} ({vp['width']}px)")
                
            # Screenshot
            screenshot_path = os.path.join(ARTIFACT_DIR, f"{page.split('.')[0]}_{vp['name']}.png")
            driver.save_screenshot(screenshot_path)
            # print(f"Saved screenshot: {screenshot_path}")

    driver.quit()
    print("\nQA script finished.")
except Exception as e:
    print(f"Selenium Error: {e}")
