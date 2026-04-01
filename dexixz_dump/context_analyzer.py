import os
import re
import sys

# Target Files
TARGET_FILES = {
    "options": r"c:\Users\Mr Thomas\Documents\trae_projects\Dexi style\dexixz_dump\static\js\pages_transaction_options.4e0fffec.js",
    "assets": r"c:\Users\Mr Thomas\Documents\trae_projects\Dexi style\dexixz_dump\static\js\pages_fund_assets.3dbd67e9.js",
    "vendors": r"c:\Users\Mr Thomas\Documents\trae_projects\Dexi style\dexixz_dump\static\js\chunk_vendors.0e143989.js",
    "index": r"c:\Users\Mr Thomas\Documents\trae_projects\Dexi style\dexixz_dump\static\js\index.eaa323ff.js",
    "contract": r"c:\Users\Mr Thomas\Documents\trae_projects\Dexi style\dexixz_dump\static\js\pages_transaction_contract.84126f15.js"
}

# High-Value Keywords to Contextualize
KEYWORDS = [
    "margin", "hazard_rate", "profitPrice", "lossPrice", 
    "expectedProfit", "expectedLoss", "loan_rate", "fact_profits",
    "leverProfitLoss", "microProfitLoss", "force_key", "rate", "fee"
]

def analyze_context():
    print("🔬 Deep Context Analysis of High-Value Keywords...\n", flush=True)
    
    for label, file_path in TARGET_FILES.items():
        if not os.path.exists(file_path):
            print(f"⚠️ File not found: {file_path}", flush=True)
            continue
            
        print(f"📂 Analyzing {os.path.basename(file_path)}...", flush=True)
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            for kw in KEYWORDS:
                # Find all occurrences
                matches = [m.start() for m in re.finditer(re.escape(kw), content)]
                
                if matches:
                    print(f"   found '{kw}' ({len(matches)} times)", flush=True)
                    # Show first 3 contexts
                    for i, idx in enumerate(matches[:3]):
                        start = max(0, idx - 100)
                        end = min(len(content), idx + 200)
                        snippet = content[start:end].replace('\n', ' ')
                        print(f"      Context {i+1}: ...{snippet}...", flush=True)
            print("-" * 50, flush=True)
        except Exception as e:
            print(f"❌ Error reading file: {e}", flush=True)

if __name__ == "__main__":
    analyze_context()
