#!/usr/bin/env python3
import argparse, re, sys
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument("inventory")
p.add_argument("skills", nargs="*")
a = p.parse_args()
text = Path(a.inventory).read_text(encoding="utf-8", errors="replace")
# Inventory rows are markdown tables; capture the skill column conservatively.
names = set()
for line in text.splitlines():
    if not line.startswith("|"):
        continue
    cols = [c.strip() for c in line.strip().strip("|").split("|")]
    if len(cols) >= 2 and re.fullmatch(r"\d+", cols[0] or ""):
        names.add(cols[1])
missing = [s for s in a.skills if s not in names]
print(f"inventory_skills={len(names)}")
for s in a.skills:
    print(f"{'OK' if s in names else 'MISSING'}\t{s}")
sys.exit(1 if missing else 0)
