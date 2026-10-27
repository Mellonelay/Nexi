"""Bounded-memory SQL-export to restored-SQLite content reconciliation.
Never writes the restored file. Source literals are interpreted by SQLite using
the exported table affinities in RAM; batches are hashed then discarded.
Only counts/schema/key/content fingerprints are persisted, never raw records.
"""
from pathlib import Path
import sqlite3,gzip,io,re,json,hashlib,datetime,struct,sys,time
ROOT=Path(__file__).resolve().parent
BASE=Path('/home/mellonelay1999/nexi-migration-snapshots')
MOD=2**256
def cell(v):
    if v is None:return ['null']
    if isinstance(v,bytes):return ['blob',v.hex()]
    if isinstance(v,int):return ['integer',str(v)]
    if isinstance(v,float):return ['real',struct.pack('>d',v).hex()]
    return ['text',v]
def fingerprint():
    return {'count':0,'sha256_sum':0,'sha256_xor':0}
def add(fp,row):
    payload=json.dumps([cell(v) for v in row],ensure_ascii=False,separators=(',',':')).encode()
    value=int.from_bytes(hashlib.sha256(payload).digest(),'big')
    fp['count']+=1;fp['sha256_sum']=(fp['sha256_sum']+value)%MOD;fp['sha256_xor']^=value
def render(fp):
    return {'count':fp['count'],'sha256_sum':format(fp['sha256_sum'],'064x'),'sha256_xor':format(fp['sha256_xor'],'064x')}
def quote(s):return '"'+s.replace('"','""')+'"'
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def self_test():
    a,b=fingerprint(),fingerprint()
    rows=[(None,"a'b\n雪",b'\x00\xff',1,1.25),(None,'other',b'',-3,-0.0)]
    for row in rows:add(a,row)
    for row in reversed(rows):add(b,row)
    assert render(a)==render(b)
    add(b,(None,'tampered',b'',-3,-0.0));assert render(a)!=render(b)
    print('RECONCILER_SELF_TEST_PASS')
if '--self-test' in sys.argv:self_test();sys.exit(0)
self_test()
archive=BASE/'nexi-core-full-20261016.sql.gz';target=BASE/'nexi-core-restored-20261016.sqlite'
before={str(p):{'size':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns} for p in [archive,target]}
memory=sqlite3.connect(':memory:');memory.execute('PRAGMA foreign_keys=OFF')
restored=sqlite3.connect('file:'+str(target)+'?mode=ro',uri=True)
restored.execute('PRAGMA query_only=ON')
tables=[x[0] for x in restored.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
cols={t:[r[1] for r in restored.execute('PRAGMA table_info('+quote(t)+')')] for t in tables}
keys={t:[r[1] for r in sorted(restored.execute('PRAGMA table_info('+quote(t)+')').fetchall(),key=lambda r:r[5]) if r[5]] for t in tables}
source={t:{'content':fingerprint(),'keys':fingerprint()} for t in tables}
source_schema={};pending={};total=0
report={'startedAt':now(),'method':'SQLite-affinity evaluated SQL rows; order-independent count + sum/xor of typed SHA256 row/key digests; source gzip CRC checked at EOF; restored file read-only. Hash evidence, not live cutover equality.','artifacts':before,'tables':{},'status':'IN_PROGRESS'}
out=ROOT/'evidence/export-restored-content-reconciliation.json'
def flush(t):
    if not pending.get(t):return
    columns=cols[t];indexes=[columns.index(c) for c in keys[t]]
    for row in memory.execute('SELECT '+','.join(map(quote,columns))+' FROM '+quote(t)):
        add(source[t]['content'],row);add(source[t]['keys'],[row[i] for i in indexes])
    memory.execute('DELETE FROM '+quote(t));pending[t]=0
compressed_hash=hashlib.sha256()
class DigestReader:
    def __init__(self,f):self.f=f
    def read(self,n=-1):
        b=self.f.read(n);compressed_hash.update(b);return b
    def seekable(self):return False
    def readable(self):return True
start=time.monotonic();statement='';last_table=None
with archive.open('rb') as raw:
    with gzip.GzipFile(fileobj=DigestReader(raw),mode='rb') as gz:
        with io.TextIOWrapper(gz,encoding='utf-8') as stream:
            for line in stream:
                statement+=line
                if len(statement)>32*1024*1024:raise RuntimeError('Unbounded SQL statement')
                if not sqlite3.complete_statement(statement):continue
                sql=statement.strip();statement=''
                if not sql:continue
                if sql.upper().startswith('CREATE TABLE'):
                    memory.execute(sql)
                    continue
                if not sql.upper().startswith('INSERT INTO'):continue
                match=re.match(r'INSERT INTO\s+"((?:[^"]|"")+)"',sql,re.I)
                if not match:raise RuntimeError('Unsupported INSERT identifier')
                table=match.group(1).replace('""','"')
                if table.startswith('sqlite_'):continue
                if table not in source:raise RuntimeError('Unexpected source table '+table)
                if last_table and table!=last_table:
                    flush(last_table)
                    print('SOURCE_TABLE',last_table,source[last_table]['content']['count'],flush=True)
                last_table=table;memory.execute(sql);pending[table]=pending.get(table,0)+1;total+=1
                if pending[table]>=1000:flush(table)
                if total%250000==0:
                    report['sourceRowsScanned']=total;report['lastSourceTable']=table;out.write_text(json.dumps(report,indent=2)+'\n')
                    print('SOURCE_ROWS',total,'elapsed_seconds',round(time.monotonic()-start),flush=True)
if statement.strip():raise RuntimeError('Incomplete SQL at archive EOF')
for t in tables:flush(t)
report['gzipValidated']=True;report['archiveSha256']=compressed_hash.hexdigest();report['sourceRowsScanned']=total
out.write_text(json.dumps(report,indent=2)+'\n')
print('SOURCE_SCAN_COMPLETE',total,flush=True)
for t in tables:
    content,key=fingerprint(),fingerprint()
    indexes=[cols[t].index(c) for c in keys[t]]
    for row in restored.execute('SELECT '+','.join(map(quote,cols[t]))+' FROM '+quote(t)):
        add(content,row);add(key,[row[i] for i in indexes])
    item={'source':{'content':render(source[t]['content']),'keys':render(source[t]['keys'])},'restored':{'content':render(content),'keys':render(key)}}
    item['equal']=item['source']==item['restored']
    report['tables'][t]=item;out.write_text(json.dumps(report,indent=2)+'\n')
    print('RESTORED_TABLE',t,content['count'],'MATCH' if item['equal'] else 'MISMATCH',flush=True)
after={str(p):{'size':p.stat().st_size,'mtime_ns':p.stat().st_mtime_ns} for p in [archive,target]}
report['artifactsUnchanged']=before==after
report['finishedAt']=now();report['elapsedSeconds']=round(time.monotonic()-start,2)
report['equalTables']=sum(v['equal'] for v in report['tables'].values())
report['status']='PASS' if report['artifactsUnchanged'] and report['equalTables']==len(tables) else 'FAIL'
report['internalTables']=[r[0] for r in restored.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sqlite_%'")]
out.write_text(json.dumps(report,indent=2)+'\n')
print('FINAL',report['status'],'TABLES',len(tables),'EQUAL',report['equalTables'],'ELAPSED',report['elapsedSeconds'],flush=True)
memory.close();restored.close()
sys.exit(0 if report['status']=='PASS' else 1)
