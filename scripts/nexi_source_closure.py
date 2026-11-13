#!/usr/bin/env python3
"""Thin NEXI source-first packet launcher; never run application tests/builds."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse, json, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parent.parent
KERNEL=Path('/home/mellonelay1999/.local/share/sentinelx-vm-kernel/sx_kernel.py')
GRAPH=ROOT/'graphify-out/graph.json'
DOMAINS={
 'binary':('Binary terminal settlement, Public/Admin status','backend::src_binary_binary_service_binaryservice',['backend/src/binary/binary.service.ts','backend/src/binary/binary-settlement.scheduler.ts','frontend/app/dashboard/binary/page.tsx']),
 'margin':('Margin CLOSING, re-entry and durable settlement','backend::src_spot_margin_service_marginservice',['backend/src/spot/margin.service.ts','frontend/app/dashboard/spot/page.tsx']),
 'spot':('Spot cancellation, fill and market readback','backend::src_spot_spot_service_spotservice',['backend/src/spot/spot.service.ts','backend/src/d1/d1-financial-command.gateway.ts']),
 'wallet':('Wallet account/catalog capability semantics',None,['frontend/app/dashboard/wallet/page.tsx','backend/src/wallet/wallet.service.ts']),
 'convert':('Convert receipt and quote-expiry recovery',None,['backend/src/financial/financial-operations.service.ts']),
 'transfer':('Transfer original-key durable recovery',None,['backend/src/financial/financial-operations.service.ts']),
 'mining':('Mining entitlement and reserve/release readback',None,['backend/src/mining/mining.service.ts','frontend/app/dashboard/mining/page.tsx']),
 'loans':('Loan eligibility/collateral and Admin readback',None,['backend/src/loans/loans.service.ts','frontend/app/dashboard/loans/page.tsx']),
 'auth':('SIWE mainnet and session/account-switch recovery',None,['backend/src/auth/auth.service.ts']),
 'admin-finance':('Admin audit, finance projections and permissions','backend::src_admin_admin_service_adminservice',['backend/src/admin/admin.service.ts','Admin/src/admin/data/nexi-api-provider.ts']),
 'comms-ui':('Realtime notifications and Public mobile geometry',None,['backend/src/communications/communications.service.ts','frontend/app/dashboard/page.tsx']),
}
REQUIRED=['AGENTS.md','backend/AGENTS.md','frontend/AGENTS.md','Admin/AGENTS.md',
'tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md','tasks/NEXI_ARCHITECTURE_SOURCE_CLOSURE_WORKFLOW_TEMPLATE_20261112.md']
def cmd(args, timeout=25, limit=3800):
 try:
  p=subprocess.run(args,cwd=ROOT,text=True,capture_output=True,timeout=timeout)
  return dict(rc=p.returncode,out=p.stdout[:limit].strip(),err=p.stderr[:250].strip())
 except (OSError,subprocess.TimeoutExpired) as e:return dict(rc=125,out='',err=str(e)[:200])
def preflight():
 def git():
  h=cmd(['git','rev-parse','--short','HEAD'])
  st=cmd(['git','status','--porcelain=v1'])
  return dict(head=h['out'],status_rc=st['rc'],dirty_count_bounded=len(st['out'].splitlines()),dirty_sample=st['out'].splitlines()[:10])
 def authority():
  paths=REQUIRED+['graphify-out/graph.json']
  return dict(files={p:(ROOT/p).is_file() for p in paths},kernel=KERNEL.is_file())
 def disk():
  x=shutil.disk_usage(ROOT)
  return dict(free_mib=x.free//(1024*1024),storage_hold=x.free<2*1024**3)
 with ThreadPoolExecutor(max_workers=3) as pool:
  a,b,c=list(pool.map(lambda f:f(),[git,authority,disk]))
 ok=a['status_rc']==0 and all(b['files'].values()) and b['kernel']
 return dict(ready=ok,head=a,authority=b,disk=c,read_lanes=3,shared_writer='SERIAL',phase='SOURCE_ONLY',application_tests='DEFERRED_BY_OWNER_SOURCE_FIRST_RULE')
def packet(domain):
 pre=preflight()
 if not pre['ready']:return dict(ok=False,preflight=pre)
 title,node,paths=DOMAINS[domain]
 question='NEXI '+title+' exact causal owner and Backend Public Admin consumer contracts'
 knowledge=cmd(['/usr/bin/python3',str(KERNEL),'source-map','--question',question],70,25000)
 try:
  parsed=json.loads(knowledge['out'])
  knowledge['out']={
   'compact_task_context':parsed.get('compact_task_context'),
   'knowledge_readiness':parsed.get('knowledge_readiness'),
   'graph_followup':parsed.get('graph_followup'),
   'graph_sha256':parsed.get('graph_sha256')
  }
 except (ValueError,TypeError):
  knowledge['out']=str(knowledge['out'])[:900]
 graph=cmd(['graphify','explain',node,'--all','--graph',str(GRAPH)],25) if node else {'rc':None,'out':'Resolve L0 ID from task-specific graph query','err':''}
 return dict(ok=knowledge['rc']==0 and (node is None or graph['rc']==0) and all((ROOT/p).is_file() for p in paths),domain=domain,requirement=title,head=pre['head']['head'],source_map=knowledge,graph_locator=graph,source_files={p:(ROOT/p).is_file() for p in paths},next='Host skill + exact L0/L1 + dirty source; one serial source writer; source-only proof; checkpoint',note='Graph is locator only. No app tests, removed Admin features, new inventories or extra writers.')
def main():
 p=argparse.ArgumentParser()
 p.add_argument('operation',choices=['preflight','packet','domains','source-check'])
 p.add_argument('--domain',choices=list(DOMAINS))
 a=p.parse_args()
 if a.operation=='preflight':out=preflight()
 elif a.operation=='domains':out={k:v[0] for k,v in DOMAINS.items()}
 elif a.operation=='source-check':out=dict(source_diff=cmd(['git','-c','core.whitespace=cr-at-eol','diff','--check']),app_tests='NOT_EXECUTED')
 else:
  if not a.domain:p.error('packet requires --domain')
  out=packet(a.domain)
 print(json.dumps(out,indent=2))
 return 0 if out.get('ready',True) and out.get('ok',True) and out.get('source_diff',{}).get('rc',0)==0 else 2
if __name__=='__main__':sys.exit(main())
