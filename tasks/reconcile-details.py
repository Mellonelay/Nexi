"""Read-only detailed differences and exact Decimal financial totals. No raw identities persisted."""
from pathlib import Path
import sqlite3,subprocess,json,datetime,decimal,collections
from reconcile_sql import quote_existing_table
ROOT=Path(__file__).resolve().parent
DB='/home/mellonelay1999/nexi-migration-snapshots/nexi-core-restored-20261016.sqlite'
db=sqlite3.connect('file:'+DB+'?mode=ro',uri=True);db.row_factory=sqlite3.Row
base=json.loads((ROOT/'evidence/small-table-content-reconciliation.json').read_text())
drift=[x['table'] for x in base['tables'] if not x['equal']]
financial={'LedgerAccount':['available','locked'],'LedgerPosting':['amount','availableDelta','lockedDelta']}
tables=drift+list(financial)
quoted_tables={table:quote_existing_table(db,table) for table in tables}
batch=[{'sql':f'SELECT * FROM {quoted_tables[t]} LIMIT 1001','params':[]} for t in tables]
p=subprocess.run(['cf','-q','d1','query','522177fa-ac42-4d8f-a6a8-b34eed262f15','--batch',json.dumps(batch)],capture_output=True,text=True,timeout=120)
if p.returncode:raise RuntimeError('CF query failed')
remote=json.loads(p.stdout)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Live D1 vs historical SQLite; raw data remains in memory; source queries are not a frozen snapshot.','drift':[],'financialAggregates':[]}
for table,result in zip(tables,remote):
 if result.get('success') is False:raise RuntimeError('D1 query failed')
 rows=result['results'];local=[dict(r) for r in db.execute(f'SELECT * FROM {quoted_tables[table]}')]
 if len(rows)>=1001:raise RuntimeError('Unexpected truncation')
 if table in drift:
  schema=list(db.execute(f'PRAGMA table_info({quoted_tables[table]})'));keys=[r['name'] for r in sorted(schema,key=lambda r:r['pk']) if r['pk']]
  if not keys:raise RuntimeError('No primary key: '+table)
  key=lambda r:json.dumps([r[k] for k in keys],sort_keys=True,separators=(',',':'))
  a={key(r):r for r in local};b={key(r):r for r in rows}
  changed=collections.Counter();same=0
  for k in a.keys()&b.keys():
   diff=[c for c in a[k] if a[k][c]!=b[k][c]]
   if not diff:same+=1
   changed.update(diff)
  report['drift'].append({'table':table,'localRows':len(a),'sourceRows':len(b),'samePrimaryKeys':len(a.keys()&b.keys()),'unchangedRows':same,'localOnlyKeys':len(a.keys()-b.keys()),'sourceOnlyKeys':len(b.keys()-a.keys()),'changedColumns':dict(changed)})
 else:
  def totals(data):
   out={}
   for r in data:
    asset=r.get('asset','UNSPECIFIED');group=out.setdefault(asset,{c:decimal.Decimal(0) for c in financial[table]})
    for c in financial[table]:
     if r[c] is not None:group[c]+=decimal.Decimal(str(r[c]))
   return {a:{c:format(v,'f') for c,v in sums.items()} for a,sums in out.items()}
  a,b=totals(local),totals(rows)
  report['financialAggregates'].append({'table':table,'localRows':len(local),'sourceRows':len(rows),'localTotalsByAsset':a,'sourceTotalsByAsset':b,'exactEqual':a==b})
(ROOT/'evidence/detailed-data-reconciliation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
