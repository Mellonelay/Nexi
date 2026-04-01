import os
import re
import glob

JS_DIR = r"c:/Users/Mr Thomas/Documents/trae_projects/Dexi style/dexixz_dump/static/js"

def scan_all_files():
    print("🚀 Starting Comprehensive Scan of ALL JS Files...")
    
    if not os.path.exists(JS_DIR):
        print(f"❌ Directory not found: {JS_DIR}")
        return

    files = glob.glob(os.path.join(JS_DIR, "*.js"))
    print(f"📂 Found {len(files)} JavaScript files in total.\n")

    # Patterns to look for
    api_pattern = re.compile(r'["\'](/api/[^"\']+|/[a-z]+/[a-z_]+)["\']')
    key_pattern = re.compile(r'(?:[{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:)', re.MULTILINE)
    
    # Specific interesting keywords to highlight
    interest_keywords = ["profit", "loss", "risk", "rate", "fee", "bonus", "admin", "wallet", "contract", "leverage"]

    global_endpoints = set()
    global_keys = set()
    
    for file_path in files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # 1. Find Endpoints
            endpoints = set(api_pattern.findall(content))
            # Filter noise (short strings)
            endpoints = {e for e in endpoints if len(e) > 3 and not e.startswith("//")}
            global_endpoints.update(endpoints)

            # 2. Find Keys (heuristic)
            # We limit this to lines containing interesting keywords to reduce noise from minified variable names like 'a', 'b'
            keys = set()
            for match in key_pattern.finditer(content):
                k = match.group(1)
                if len(k) > 4 and k not in ["function", "return", "default", "value", "staticClass", "staticStyle"]:
                    keys.add(k)
            
            # Filter keys to only those that seem "business logic" related or contain interest keywords
            relevant_keys = {k for k in keys if any(ik in k.lower() for ik in interest_keywords)}
            global_keys.update(relevant_keys)

            if endpoints or relevant_keys:
                print(f"📄 {filename}")
                if endpoints:
                    print(f"   🔗 Endpoints ({len(endpoints)}): {', '.join(list(endpoints)[:5])}...")
                if relevant_keys:
                    print(f"   🔑 Key Logic Keys ({len(relevant_keys)}): {', '.join(list(relevant_keys)[:5])}...")
                print("-" * 40)

        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")

    print("\n✅ ANALYSIS COMPLETE")
    print(f"Total Unique API Endpoints Discovered: {len(global_endpoints)}")
    print(f"Total Unique Business Logic Keys Discovered: {len(global_keys)}")
    
    print("\n🔥 TOP 20 DISCOVERED ENDPOINTS:")
    for ep in sorted(list(global_endpoints))[:20]:
        print(f"  {ep}")

    print("\n💎 TOP 20 DISCOVERED KEYS:")
    for k in sorted(list(global_keys))[:20]:
        print(f"  {k}")

if __name__ == "__main__":
    scan_all_files()
