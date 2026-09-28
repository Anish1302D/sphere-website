import sys
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

try:
    driver = webdriver.Chrome(options=options)
    driver.get('http://localhost:3000/team.html')
    
    # Wait a bit
    import time
    time.sleep(3)
    
    # Print console logs
    logs = driver.get_log('browser')
    print("CONSOLE LOGS:")
    for log in logs:
        print(f"[{log['level']}] {log['message']}")
        
    driver.quit()
except Exception as e:
    print(f"Selenium Error: {e}")
