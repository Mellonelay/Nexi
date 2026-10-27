import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalDepositProofStore } from '../../src/financial/local-deposit-proof.store';
import { LocalDepositProofController } from '../../src/financial/local-deposit-proof.controller';
import { FinancialOperationsService } from '../../src/financial/financial-operations.service';

describe('VPS local deposit proof and claims',()=>{
  const previous={flag:process.env.NEXI_LOCAL_OBJECTS_ENABLED,root:process.env.NEXI_LOCAL_OBJECTS_ROOT};
  let root:string;
  const key='deposit-proofs/user-1/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const image=Buffer.from([137,80,78,71,13,10,26,10,0]);
  beforeEach(()=>{
    root=mkdtempSync(join(tmpdir(),'nexi-deposit-proof-'));
    process.env.NEXI_LOCAL_OBJECTS_ENABLED='true';
    process.env.NEXI_LOCAL_OBJECTS_ROOT=root;
  });
  afterEach(()=>{
    if(previous.flag===undefined)delete process.env.NEXI_LOCAL_OBJECTS_ENABLED;else process.env.NEXI_LOCAL_OBJECTS_ENABLED=previous.flag;
    if(previous.root===undefined)delete process.env.NEXI_LOCAL_OBJECTS_ROOT;else process.env.NEXI_LOCAL_OBJECTS_ROOT=previous.root;
    rmSync(root,{recursive:true,force:true});
  });
  it('writes private content only for an authorized user key and preserves existence checks',async()=>{
    const store=new LocalDepositProofStore();
    expect(await store.head(key)).toBe(false);
    const gateway={submitDepositClaim:async()=>({id:'claim-1',state:'PENDING'})} as any;
    const finance=new FinancialOperationsService(gateway,store);
    const controller=new LocalDepositProofController(finance,store);
    async function* body(){ yield image; }
    await expect(controller.upload(key,{user:{userId:'other-user'},[Symbol.asyncIterator]:body} as any,'image/png')).rejects.toThrow('key is invalid');
    await expect(controller.upload(key,{user:{userId:'user-1'},headers:{'content-length':String(image.length)},[Symbol.asyncIterator]:body} as any,'image/png'))
      .resolves.toEqual({key,status:'UPLOADED'});
    expect(await store.head(key)).toBe(true);
    await expect(finance.submitDepositClaim('user-1',{
      asset:'USDT',network:'ERC20',depositAddressId:'addr',claimedAmount:'1',
      proofObjectKey:key,idempotencyKey:'deposit-proof-test-1',
    })).resolves.toMatchObject({depositRequestId:'claim-1'});
  });
  it('blocks missing-proof claims, traversal and malformed image data',async()=>{
    const store=new LocalDepositProofStore();
    const gateway={submitDepositClaim:async()=>{throw Error('must not execute');}} as any;
    const finance=new FinancialOperationsService(gateway,store);
    await expect(finance.submitDepositClaim('user-1',{
      asset:'USDT',network:'ERC20',depositAddressId:'addr',claimedAmount:'1',
      proofObjectKey:key,idempotencyKey:'deposit-proof-test-2',
    })).rejects.toThrow('object is not available');
    await expect(store.put('deposit-proofs/../escape',image,'image/png')).rejects.toThrow();
    await expect(store.put([key] as unknown as string,image,'image/png')).rejects.toThrow('unavailable');
    await expect(store.put(key,Buffer.from('invalid'),'image/png')).rejects.toThrow('Unsupported');
    expect(existsSync(join(root,'escape'))).toBe(false);
  });
  it('rejects an array-valued upload key before authorization or storage',async()=>{
    const financial=new FinancialOperationsService({} as any);
    const authorize=jest.spyOn(financial,'authorizeDepositProofUpload');
    const objects={uploadStream:jest.fn()} as any;
    const controller=new LocalDepositProofController(financial,objects);
    async function* body(){ yield image; }
    await expect(controller.upload([key] as unknown as string,{user:{userId:'user-1'},[Symbol.asyncIterator]:body} as any,'image/png'))
      .rejects.toThrow('key must be a string');
    expect(authorize).not.toHaveBeenCalled();
    expect(objects.uploadStream).not.toHaveBeenCalled();
    expect(()=>financial.authorizeDepositProofUpload('user-1',[key] as unknown as string)).toThrow('key is invalid');
  });
  it('refuses operation outside explicitly enabled local mode',async()=>{
    delete process.env.NEXI_LOCAL_OBJECTS_ENABLED;
    await expect(new LocalDepositProofStore().head(key)).rejects.toThrow('unavailable');
  });
});
