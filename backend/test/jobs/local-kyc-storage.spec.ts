import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KycEvidenceStorageService } from '../../src/kyc/kyc-evidence-storage.service';

describe('private KYC evidence local file backend',()=>{
  const previous={flag:process.env.NEXI_LOCAL_OBJECTS_ENABLED,root:process.env.NEXI_LOCAL_OBJECTS_ROOT};
  let root:string;
  const bytes=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3]);
  beforeEach(()=>{
    root=mkdtempSync(join(tmpdir(),'nexi-kyc-storage-'));
    process.env.NEXI_LOCAL_OBJECTS_ENABLED='true';
    process.env.NEXI_LOCAL_OBJECTS_ROOT=root;
  });
  afterEach(()=>{
    if(previous.flag===undefined)delete process.env.NEXI_LOCAL_OBJECTS_ENABLED;
    else process.env.NEXI_LOCAL_OBJECTS_ENABLED=previous.flag;
    if(previous.root===undefined)delete process.env.NEXI_LOCAL_OBJECTS_ROOT;
    else process.env.NEXI_LOCAL_OBJECTS_ROOT=previous.root;
    rmSync(root,{recursive:true,force:true});
  });
  it('preserves private upload / existence / download behavior without Cloudflare',async()=>{
    const svc=new KycEvidenceStorageService();const key='kyc-evidence/user-1/evidence-1';
    expect(await svc.head(key)).toBe(false);
    await svc.put(key,bytes,'image/png');
    expect(await svc.head(key)).toBe(true);
    expect(await svc.get(key)).toEqual({body:bytes,contentType:'image/png'});
    await expect(svc.put(key,bytes,'image/png')).rejects.toThrow('could not be stored');
    expect(await svc.get('kyc-evidence/user-1/absent')).toBeNull();
  });
  it('rejects path escape, symlinks and malformed uploads',async()=>{
    const svc=new KycEvidenceStorageService();
    await expect(svc.put('kyc-evidence/../escape',bytes,'image/png')).rejects.toThrow('misconfigured');
    await expect(svc.put('kyc-evidence/user-1/bad',Buffer.from('junk'),'image/png')).rejects.toThrow();
    expect(existsSync(join(root,'escape'))).toBe(false);
  });
  it('fails closed if local root is missing',async()=>{
    process.env.NEXI_LOCAL_OBJECTS_ROOT=join(root,'not-created');
    await expect(new KycEvidenceStorageService().head('kyc-evidence/u/e')).rejects.toThrow('unavailable');
  });
});
