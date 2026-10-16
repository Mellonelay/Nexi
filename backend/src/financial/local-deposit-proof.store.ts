import { Injectable, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { constants } from 'node:fs';
import { lstat, mkdir, open, realpath } from 'node:fs/promises';
import { isAbsolute, dirname, join, sep } from 'node:path';

const MAX_BYTES=10*1024*1024;
const objectKey=/^deposit-proofs\/[A-Za-z0-9._:-]{1,160}\/[0-9a-f-]{36}$/;

@Injectable()
export class LocalDepositProofStore {
  private async file(key:string):Promise<string> {
    const root=process.env.NEXI_LOCAL_OBJECTS_ROOT;
    if(process.env.NEXI_LOCAL_OBJECTS_ENABLED!=='true'||!root||!isAbsolute(root)||
      key.includes('..')||!objectKey.test(key)){
      throw new ServiceUnavailableException('Private local deposit proof storage is unavailable');
    }
    try {
      if((await lstat(root)).isSymbolicLink())throw Error('Unsafe object root');
      const actualRoot=await realpath(root);
      const file=join(actualRoot,...key.split('/'));
      if(!file.startsWith(actualRoot+sep))throw Error('Unsafe object key');
      await mkdir(dirname(file),{recursive:true,mode:0o700});
      const parent=await realpath(dirname(file));
      if(!parent.startsWith(actualRoot+sep))throw Error('Unsafe object directory');
      return join(parent,key.split('/').at(-1)!);
    }catch {
      throw new ServiceUnavailableException('Private local deposit proof storage is unavailable');
    }
  }

  private check(body:Buffer,contentType:string):void {
    const type=contentType.split(';',1)[0].trim().toLowerCase();
    const png=body.length>=8&&body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpg=body.length>=3&&body.subarray(0,3).equals(Buffer.from([255,216,255]));
    const gif=body.length>=6&&['GIF89a','GIF87a'].includes(body.toString('ascii',0,6));
    const webp=body.length>=12&&body.toString('ascii',0,4)==='RIFF'&&body.toString('ascii',8,12)==='WEBP';
    if(!body.length||body.length>MAX_BYTES||!((type==='image/png'&&png)||(type==='image/jpeg'&&jpg)||
      (type==='image/gif'&&gif)||(type==='image/webp'&&webp))) {
      throw new BadRequestException('Unsupported or oversized deposit proof');
    }
  }

  async put(key:string,bytes:Buffer,contentType:string):Promise<void>{
    const filename=await this.file(key);
    this.check(bytes,contentType);
    let handle;
    try{
      handle=await open(filename,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
      await handle.writeFile(bytes);
    }catch{
      throw new ServiceUnavailableException('Private deposit proof could not be stored');
    }finally{await handle?.close();}
  }

  async head(key:string):Promise<boolean>{
    const filename=await this.file(key);
    try{
      const stat=await lstat(filename);
      return stat.isFile()&&stat.size>0&&stat.size<=MAX_BYTES;
    }catch(e){
      if((e as NodeJS.ErrnoException).code==='ENOENT')return false;
      throw new ServiceUnavailableException('Private deposit proof could not be verified');
    }
  }
}
