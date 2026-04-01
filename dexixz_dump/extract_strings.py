import re
import os
import glob

JS_DIR = r"c:/Users/Mr Thomas/Documents/trae_projects/Dexi style/dexixz_dump/static/js"

def extract_strings():
    print("Starting extraction...")
    files = glob.glob(os.path.join(JS_DIR, "*contract*.js"))
    print(f"Found {len(files)} contract files.")

    relevant_keywords = ["risk", "rate", "fee", "payout", "profit", "loss", "calc", "formula", "contract", "api", "http", "price", "amount", "lever", "margin"]

    for file_path in files:
        print(f"\nScanning: {os.path.basename(file_path)}")
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Find all strings
            strings = re.findall(r'["\']([^"\']{4,})["\']', content)
            print(f"  Found {len(strings)} strings.")
            
            for s in strings:
                if any(k in s.lower() for k in relevant_keywords) or "/" in s:
                    # Filter noise
                    if len(s) < 100:
                        print(f"    -> {s}")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    extract_strings()
