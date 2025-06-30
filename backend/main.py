import sys
import asyncio

if sys.platform.startswith("win"):
    if sys.version_info >= (3, 12):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    else:
        # For older versions of Python on Windows
        # Use ProactorEventLoopPolicy for compatibility
        # with Playwright and other async libraries
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx
import re
import random
import asyncio
from playwright.async_api import async_playwright
import os
from fastapi.responses import FileResponse
import zipfile
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    url: str

class VPNCheckRequest(BaseModel):
    expected_ip: str  # The IP you expect when VPN is ON

TOR_SOCKS_PROXY = os.getenv("TOR_SOCKS_PROXY", "socks5://127.0.0.1:9050")

def is_onion(url: str) -> bool:
    return ".onion" in url

@app.get("/search")
def search_onion_links(query: str = Query(..., description="Search query")):
    # Format query for URL
    formatted_query = query.replace(" ", "+")
    url = f"https://ahmia.fi/search/?q={formatted_query}"
    ua_list = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19577",
        "Mozilla/5.0 (X11) AppleWebKit/62.41 (KHTML, like Gecko) Edge/17.10859 Safari/452.6",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2656.18 Safari/537.36",
        "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML like Gecko) Chrome/44.0.2403.155 Safari/537.36",
        "Mozilla/5.0 (Linux; U; en-US) AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.27 Safari/525.13",
        "Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
        "Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10_5_8; zh-cn) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27"
    ]
    headers = {'User-Agent': random.choice(ua_list)}
    try:
        resp = httpx.get(url, headers=headers, timeout=15)
        content = resp.text
        onion_links = list(set(re.findall(r"\w+\.onion", content)))
        return {"links": onion_links}
    except Exception as e:
        return {"error": str(e)}

@app.post("/vpn-check")
def vpn_check(req: VPNCheckRequest):
    try:
        resp = httpx.get("https://api.ipify.org?format=json", timeout=10)
        current_ip = resp.json().get("ip", "")
        vpn_ok = current_ip == req.expected_ip
        return {"current_ip": current_ip, "vpn_ok": vpn_ok}
    except Exception as e:
        return {"error": str(e), "vpn_ok": False}

@app.post("/scrape-offline-selenium")
def scrape_offline_selenium(req: ScrapeRequest):
    import shutil
    import pathlib
    import mimetypes
    import uuid
    import requests
    # Create a unique temp directory for this scrape
    temp_dir = f"offline_{uuid.uuid4().hex}"
    os.makedirs(temp_dir, exist_ok=True)
    assets_dir = os.path.join(temp_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    # Set up Selenium Chrome in headless mode
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    # For .onion, set proxy to Tor
    if is_onion(req.url):
        chrome_options.add_argument('--proxy-server=socks5://127.0.0.1:9050')
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.get(req.url)
    import time
    time.sleep(5)  # Wait for JS to render content
    # Take screenshot
    screenshot_path = os.path.join(temp_dir, "screenshot.png")
    driver.save_screenshot(screenshot_path)
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    # Download images, CSS, JS
    asset_tags = [("img", "src"), ("link", "href"), ("script", "src")]
    for tag, attr in asset_tags:
        for el in soup.find_all(tag):
            url = el.get(attr)
            if url and not url.startswith("data:") and not url.startswith("#"):
                try:
                    abs_url = url if url.startswith("http") else req.url.rstrip("/") + "/" + url.lstrip("/")
                    resp = requests.get(abs_url, timeout=15)
                    if resp.status_code == 200:
                        ext = pathlib.Path(url).suffix or mimetypes.guess_extension(resp.headers.get("content-type", "")) or ".bin"
                        asset_name = f"{uuid.uuid4().hex}{ext}"
                        asset_path = os.path.join(assets_dir, asset_name)
                        with open(asset_path, "wb") as f:
                            f.write(resp.content)
                        el[attr] = f"assets/{asset_name}"
                except Exception:
                    continue
    # Save modified HTML
    html_path = os.path.join(temp_dir, "index.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(str(soup))
    # Zip everything (including screenshot)
    zip_name = f"offline_{uuid.uuid4().hex}.zip"
    with zipfile.ZipFile(zip_name, "w") as zipf:
        for root, _, files in os.walk(temp_dir):
            for file in files:
                abs_fp = os.path.join(root, file)
                rel_fp = os.path.relpath(abs_fp, temp_dir)
                zipf.write(abs_fp, rel_fp)
    shutil.rmtree(temp_dir)
    driver.quit()
    return FileResponse(zip_name, media_type="application/zip", filename=zip_name)
