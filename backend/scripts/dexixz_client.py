import requests
import json

class DexixzClient:
    BASE = "https://www.coindefgie15eg.qpon/api"

    def __init__(self, auth_token=None, php_session=None):
        self.session = requests.Session()
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
        
        # Inject Auth Token if provided
        if auth_token:
            headers["authorization"] = auth_token
            
        # Inject Session Cookie if provided
        if php_session:
            headers["Cookie"] = php_session

        self.session.headers.update(headers)

    def _get(self, path, **params):
        """Internal GET wrapper"""
        url = f"{self.BASE}{path}"
        try:
            r = self.session.get(url, params=params or None, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[!] GET Error on {path}: {e}")
            return None

    def _post_json(self, path, payload):
        """Internal POST wrapper"""
        url = f"{self.BASE}{path}"
        try:
            r = self.session.post(url, json=payload, timeout=20)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"[!] POST Error on {path}: {e}")
            return None

    # ---- Public Methods ----

    def get_hb_list(self):
        """Fetches the list of coins/markets"""
        return self._get("/getHbList")

    def get_spot_wallet(self, lang="en", show0=""):
        """Fetches Spot Wallet Balances"""
        return self._get("/wallet/spotWalletList", lang=lang, show0=show0)

    def get_contracts_wallet(self, lang="en"):
        """Fetches Futures/Contract Wallet Balances"""
        return self._get("/wallet/contractsWalletList", lang=lang)

    def get_microtrade_list(self, currency_id=32, match_id=61, status=1, page="", limit=10):
        """Fetches Binary Option Configurations (Timeframes/Payouts)"""
        return self._get(
            "/microtrade/listsV2",
            currency_id=currency_id,
            match_id=match_id,
            status=status,
            page=page,
            limit=limit,
        )

    def micro_deal(self, payload):
        """
        Executes a Binary Option Trade.
        payload example: {"currency_id": 32, "match_id": 61, "direction": "buy", "amount": "10", "time": 60}
        """
        return self._post_json("/microtrade/micro_deal", payload)


# --- Usage Example (Run this file directly to test) ---
if __name__ == "__main__":
    # Your LIVE credentials
    MY_TOKEN = "c8d37fa8ec36eedbb903eefe9b9359e0"
    MY_SESSION = "php_exchange_session=ne4goyzD9bGM0KV3RYe4HsxdGwIUgb0hmZIPr2JA"

    print("--- Initializing Client ---")
    client = DexixzClient(auth_token=MY_TOKEN, php_session=MY_SESSION)

    print("\n[*] Testing Market Data (HB List)...")
    hb = client.get_hb_list()
    if hb:
        print(f"    Success! Found {len(hb.get('data', []))} market pairs.")
    else:
        print("    Failed.")

    print("\n[*] Testing Spot Wallet...")
    spot = client.get_spot_wallet()
    if spot:
        print("    Success! Wallet data retrieved.")
        # print(json.dumps(spot, indent=2)) # Uncomment to see full wallet JSON
    else:
        print("    Failed.")

    print("\n[*] Testing Microtrade Configs (Binary Options)...")
    micro = client.get_microtrade_list()
    if micro:
        print("    Success! Configuration retrieved.")
    else:
        print("    Failed.")