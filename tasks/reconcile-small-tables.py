"""Read-only source/snapshot comparison. Raw financial/auth rows stay in memory.
A live source comparison is not a consistent point-in-time cutover snapshot.
"""
from pathlib import Path
import sqlite3, subprocess, json, hashlib, decimal, datetime, sys
ROOT=Path(__file__).resolve().parent
DB=Path('/home/mellonelay1999/nexi-migration-snapshots/nexi-core-restored-20261016.sqlite')
SOURCE='522177fa-ac42-4d8f-a6a8-b34eed262f15'
def canonical(v):
    if v is None:return ['null']
    if isinstance(v,(int,float)):return ['number',str(decimal.Decimal(str(v)).normalize())]
    if isinstance(v,bytes):return ['bytes',v.hex()]
    return ['text',v]
def digest(rows, columns):
    values=sorted(json.dumps([canonical(row[c]) for c in columns],ensure_ascii=False,separators=(',',':')).encode() for row in rows)
    h=hashlib.sha256()
    for value in values:h.update(len(value).to_bytes(8,'big'));h.update(value)
    return {'count':len(values),'sha256':h.hexdigest()}
d=sqlite3.connect('file:'+str(DB)+'?mode=ro',uri=True)
d.row_factory=sqlite3.Row
d.execute('PRAGMA query_only=ON')
local_schema=[dict(x) for x in d.execute("select name,type,sql from sqlite_master where type in ('table','index') order by type,name")]
source_schema=json.loads((ROOT/'evidence/source-schema-raw.json').read_text())[0]['results']
normalize=lambda rows:{(x['type'],x['name']):' '.join((x['sql'] or '').split()) for x in rows if not x['name'].startswith(('_cf_','sqlite_'))}
a,b=normalize(local_schema),normalize(source_schema)
schema_drift=[{'type':k[0],'name':k[1],'local':a.get(k),'source':b.get(k)} for k in sorted(a.keys()|b.keys()) if a.get(k)!=b.get(k)]
inventory=json.loads((ROOT/'evidence/local-table-inventory.json').read_text())
report={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Live D1 vs isolated historical snapshot, 90 smaller application tables; two large market tables require snapshot-boundary reconciliation. No raw rows persisted.','schemaDifferences':schema_drift,'tables':[]}
out=ROOT/'evidence/small-table-content-reconciliation.json'
for start in range(0,len(inventory),10):
    group=inventory[start:start+10]
    batch=[{'sql':'SELECT * FROM "'+x['table']+'" LIMIT 1001','params':[]} for x in group]
    p=subprocess.run(['cf','-q','d1','query',SOURCE,'--batch',json.dumps(batch)],capture_output=True,text=True,timeout=120)
    if p.returncode:raise RuntimeError('CF query failed for batch '+str(start//10)+': '+p.stderr[:180])
    remote=json.loads(p.stdout)
    if len(remote)!=len(group):raise RuntimeError('Unexpected CF batch result count')
    for entry,result in zip(group,remote):
        if result.get('success') is False:raise RuntimeError('D1 query failed')
        rows=result['results'];cols=[c['name'] for c in entry['columns']]
        left=digest([dict(x) for x in d.execute('SELECT * FROM "'+entry['table']+'"')],cols)
        right=digest(rows,cols)
        report['tables'].append({'table':entry['table'],'local':left,'source':right,'equal':left==right,'truncated':len(rows)>=1001})
    out.write_text(json.dumps(report,indent=2)+'\n')
    print('CONTENT_BATCH',start//10+1,'tables',len(report['tables']),'equal',sum(x['equal'] for x in report['tables']),flush=True)
report['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
report['equalTables']=sum(x['equal'] for x in report['tables'])
out.write_text(json.dumps(report,indent=2)+'\n')
print('SUMMARY',json.dumps({'tables':len(report['tables']),'equal':report['equalTables'],'schemaDifferences':len(schema_drift),'differentTables':[x['table'] for x in report['tables'] if not x['equal']]}),flush=True)
