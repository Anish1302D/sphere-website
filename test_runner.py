import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

routes = [
    "index.html",
    "about.html",
    "leadership.html",
    "domains.html",
    "events.html",
    "projects.html",
    "team.html",
    "faq.html",
    "brand.html",
    "privacy.html",
    "terms.html"
]

viewports = [
    (1440, 900), (1280, 800), (1024, 768), (768, 1024), (390, 844), (375, 812)
]

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

results = {
    "routes": {},
    "global_console_errors": [],
    "global_network_errors": []
}

def check_page(driver, route):
    url = f"http://localhost:3000/{route}"
    driver.get(url)
    time.sleep(2) # Wait for firebase/DOM to render
    
    page_data = {
        "url": url,
        "title": driver.title,
        "console_logs": [],
        "overflow": [],
        "visible_text_checks": {},
        "elements": {}
    }
    
    # 1. Console logs
    logs = driver.get_log('browser')
    for log in logs:
        if log['level'] == 'SEVERE':
            page_data["console_logs"].append(log['message'])
            
    # 2. Elements checks
    page_source = driver.page_source.lower()
    page_data["visible_text_checks"]["has_old_brand"] = "sphere coding club" in page_source
    page_data["visible_text_checks"]["has_glass_panel"] = "glass-panel" in page_source
    page_data["elements"]["nav_exists"] = bool(driver.find_elements('tag name', 'nav'))
    page_data["elements"]["footer_exists"] = bool(driver.find_elements('tag name', 'footer'))
    
    # 3. Viewports and overflow
    for w, h in viewports:
        driver.set_window_size(w, h)
        time.sleep(0.5)
        has_overflow = driver.execute_script("return document.documentElement.scrollWidth > window.innerWidth;")
        if has_overflow:
            page_data["overflow"].append(f"{w}x{h}")
            
    return page_data

try:
    driver = webdriver.Chrome(options=options)
    for route in routes:
        print(f"Testing {route}...")
        results["routes"][route] = check_page(driver, route)
    driver.quit()
    
    with open("qa_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Testing complete. Results saved to qa_results.json")
except Exception as e:
    print(f"Error during testing: {e}")
