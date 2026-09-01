#!/usr/bin/env python3
import sys,re
from pathlib import Path
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path('.')
skill=root/'SKILL.md'
errs=[]
if not skill.exists(): errs.append('missing SKILL.md')
else:
    t=skill.read_text(encoding='utf-8')
    if not t.startswith('---\n'): errs.append('missing YAML frontmatter')
    if not re.search(r'^name:\s*\S+',t,re.M): errs.append('missing name')
    if not re.search(r'^description:\s*.+',t,re.M): errs.append('missing description')
    for m in re.finditer(r'`(references/[^`]+|scripts/[^`]+)`',t):
        if not (root/m.group(1)).exists(): errs.append('broken reference: '+m.group(1))
print('PASS' if not errs else 'FAIL')
for e in errs: print(e)
sys.exit(1 if errs else 0)
