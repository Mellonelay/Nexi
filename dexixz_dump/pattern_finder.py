import os
import json
import re

# Path Configuration
JS_DIR = r"c:/Users/Mr Thomas/Documents/trae_projects/Dexi style/dexixz_dump/static/js"
HAR_PATH = r"c:/Users/Mr Thomas/Documents/trae_projects/Dexi style/dexixz_dump/dexixz.com.har"

KEYWORDS = [
    "win_ratio", "loss_ratio", "force", "payout", "match_id", 
    "currency_id", "admin", "setonline", "contract_wallet",
    "risk_control", "profit_rate", "seconds_order", "yield"
]

def scan_js_files():
    print("🔍 PHASE 1: Scanning JS Bundles for Business Logic...")
    findings = {}
    for root, dirs, files in os.walk(JS_DIR):
        for file in files:
            if file.endswith(".js"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    for key in KEYWORDS:
                        if key in content:
                            # Extract a snippet around the keyword
                            idx = content.find(key)
                            snippet = content[max(0, idx-50):idx+100]
                            findings.setdefault(key, []).append(f"File: {file} | Snippet: ...{snippet}...")
    
    for key, items in findings.items():
        print(f"\n✅ Found '{key}' in {len(items)} locations.")
        for item in items[:2]: # Show first 2 hits per key
            print(f"   {item}")

def analyze_har_api():
    print("\n🌐 PHASE 2: Mapping API Endpoints & JSON Contracts...")
    if not os.path.exists(HAR_PATH):
        print("❌ HAR file not found!")
        return

    with open(HAR_PATH, 'r', encoding='utf-8') as f:
        har_data = json.load(f)
        
    endpoints = []
    json_keys = set()
    
    for entry in har_data['log']['entries']:
        url = entry['request']['url'].split('?')[0]
        endpoints.append(url)
        
        # Extract keys from response body
        try:
            text = entry['response']['content'].get('text', '')
            if text:
                data = json.loads(text)
                if isinstance(data, dict):
                    json_keys.update(data.keys())
                elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                    json_keys.update(data[0].keys())
        except:
            pass

    print(f"📊 Unique Endpoints Found: {len(set(endpoints))}")
    for ep in sorted(list(set(endpoints)))[-10:]:
        print(f"   -> {ep}")
        
    print(f"\n💎 Critical Database Keys Inferred: {len(json_keys)}")
    print(f"   Keys: {list(json_keys)[:20]}")

if __name__ == "__main__":
    scan_js_files()
    analyze_har_api()