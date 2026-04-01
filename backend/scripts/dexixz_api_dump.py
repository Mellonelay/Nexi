import json
import time
import os
from pathlib import Path
import requests

# --- CONFIGURATION ---
BASE_URL = "https://www.coindefgie15eg.qpon/api"

# UPDATED: Your specific live credentials from the chat logs
AUTH_TOKEN = "c8d37fa8ec36eedbb903eefe9b9359e0"
PHP_SESSION = "php_exchange_session=ne4goyzD9bGM0KV3RYe4HsxdGwIUgb0hmZIPr2JA"

# --- SETUP SESSION ---
def make_session():
    """Creates a browser-like session with your credentials."""
    s = requests.Session()
    
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://dexixz.com",
        "Referer": "https://dexixz.com/",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0"
        ),
        "Content-Type": "application/json"
    }
    
    # Inject your credentials
    if AUTH_TOKEN:
        headers["authorization"] = AUTH_TOKEN
    
    s.headers.update(headers)
    
    # Inject the session cookie specifically
    if PHP_SESSION:
        # Parse "key=value" string if needed, or set directly header
        s.headers["Cookie"] = PHP_SESSION

    return s

def save_json(name, data):
    """Saves API response to a local JSON file."""
    out_dir = Path("dexixz_dump")
    out_dir.mkdir(exist_ok=True)
    
    filename = f"{name}.json"
    path = out_dir / filename
    
    try:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"[+] Saved {name} -> {path}")
    except Exception as e:
        print(f"[!] Error saving {name}: {e}")

# --- API FUNCTIONS ---

def get_hb_list(session):
    """Fetches Market Data (Coins list)"""
    url = f"{BASE_URL}/getHbList"
    print(f"[*] Fetching Market Data from {url}...")
    r = session.get(url, timeout=20)
    r.raise_for_status()
    data = r.json()
    save_json("hb_list", data)
    return data

def get_spot_wallet(session):
    """Fetches Spot Wallet Balances"""
    url = f"{BASE_URL}/wallet/spotWalletList"
    params = {"lang": "en", "show0": ""}
    print(f"[*] Fetching Spot Wallet...")
    r = session.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    save_json("spot_wallet", data)
    return data

def get_contracts_wallet(session):
    """Fetches Contracts/Futures Wallet"""
    url = f"{BASE_URL}/wallet/contractsWalletList"
    params = {"lang": "en"}
    print(f"[*] Fetching Contracts Wallet...")
    r = session.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    save_json("contracts_wallet", data)
    return data

def get_microtrade_list(session):
    """Fetches Binary Option Configs (Seconds, Payouts)"""
    url = f"{BASE_URL}/microtrade/listsV2"
    # These params mimic the browser request exactly
    params = {
        "currency_id": 32, # Usually BTC
        "match_id": 61,
        "status": 1,
        "page": "",
        "limit": 10,
    }
    print(f"[*] Fetching Microtrade Configs...")
    r = session.get(url, params=params, timeout=20)
    r.raise_for_status()
    data = r.json()
    save_json("microtrade_list", data)
    return data

# --- MAIN EXECUTION ---

def main():
    print("--- STARTING DEXIXZ DATA DUMP ---")
    session = make_session()

    # 1. Market Data
    try:
        get_hb_list(session)
    except Exception as e:
        print(f"[!] Failed to get Market List: {e}")

    time.sleep(1) # Be polite to the server

    # 2. Spot Wallet
    try:
        get_spot_wallet(session)
    except Exception as e:
        print(f"[!] Failed to get Spot Wallet: {e}")

    time.sleep(1)

    # 3. Contracts Wallet
    try:
        get_contracts_wallet(session)
    except Exception as e:
        print(f"[!] Failed to get Contracts Wallet: {e}")

    time.sleep(1)

    # 4. Microtrade (Binary) Configs
    try:
        get_microtrade_list(session)
    except Exception as e:
        print(f"[!] Failed to get Microtrade List: {e}")

    print("\n[✓] DONE. Check the 'dexixz_dump' folder for your JSON files.")

if __name__ == "__main__":
    main()