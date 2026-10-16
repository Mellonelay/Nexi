"""Read-only R2 copy into private staging. Never modifies source or exposes object keys."""
from pathlib import Path
import os,json,subprocess,hashlib,datetime
root=Path('/home/mellonelay1999/nexi-migration-snapshots'); dest=root/'objects';dest.mkdir(mode=0o700,exist_ok=True);dest.chmod(0o700)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Private isolated local copy, source read-only; not independent backup or retirement acceptance','buckets':[]}
for bucket in ['nexi-deposit-proofs-staging','nexi-kyc-evidence-staging']:
 entries=json.loads((root/(bucket+'-objects-private.json')).read_text());folder=dest/bucket;folder.mkdir(mode=0o700,exist_ok=True);results=[]
 for entry in entries:
  key=entry['key'];kh=hashlib.sha256(key.encode()).hexdigest();path=folder/(kh+'.body')
  if entry['size']>10*1024*1024:raise RuntimeError('Unexpected object size')
  def fetch():
   p=subprocess.run(['cf','-q','r2','objects','get',key,'--bucket-name',bucket],capture_output=True,timeout=120)
   if p.returncode:raise RuntimeError('R2 GET failed; stderr withheld')
   if len(p.stdout)!=entry['size']:raise RuntimeError('R2 size mismatch')
   return p.stdout
  body=fetch();sha=hashlib.sha256(body).hexdigest()
  if path.exists():
   if hashlib.sha256(path.read_bytes()).hexdigest()!=sha:raise RuntimeError('Existing copy differs; preserve and investigate')
  else:
   fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
   with os.fdopen(fd,'wb') as f:f.write(body);f.flush();os.fsync(f.fileno())
  if hashlib.sha256(path.read_bytes()).hexdigest()!=sha:raise RuntimeError('Local copy mismatch')
  second=fetch()
  if hashlib.sha256(second).hexdigest()!=sha:raise RuntimeError('Source changed during copy')
  meta=folder/(kh+'.metadata.json')
  if not meta.exists():
   fd=os.open(meta,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
   with os.fdopen(fd,'w') as f:json.dump(entry,f,indent=2);f.flush();os.fsync(f.fileno())
  results.append({'keySha256':kh,'bytes':len(body),'contentSha256':sha,'independentSecondGetMatches':True,'etagMatchesMd5':hashlib.md5(body).hexdigest()==entry['etag'].strip('"'),'metadataPreserved':True})
 report['buckets'].append({'bucket':bucket,'count':len(results),'bytes':sum(x['bytes'] for x in results),'objects':results})
Path(__file__).resolve().parent.joinpath('evidence/r2-copy-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
