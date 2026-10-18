import { BadRequestException, Controller, Headers, PayloadTooLargeException, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../auth/auth-surface.guard';
import { RequireAuthSurface } from '../auth/auth-surface.decorator';
import { FinancialOperationsService } from './financial-operations.service';
import { LocalDepositProofStore } from './local-deposit-proof.store';

const MAX_BYTES=10*1024*1024;

/** Equivalent to the Worker upload route; intentionally inactive outside local storage mode. */
@Controller('storage')
export class LocalDepositProofController {
  constructor(private readonly financial:FinancialOperationsService,private readonly objects:LocalDepositProofStore){}

  @Put('deposit-proof')
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async upload(
    @Query('key') key:string,
    @Req() request:AuthenticatedRequest & AsyncIterable<Uint8Array>,
    @Headers('content-type') type?:string,
  ){
    if(process.env.NEXI_LOCAL_OBJECTS_ENABLED!=='true')throw new BadRequestException('Local proof upload is disabled');
    if(!type)throw new BadRequestException('Content type required');
    this.financial.authorizeDepositProofUpload(request.user.userId,key);
    const declared=Number((request as unknown as {headers?:Record<string,string>}).headers?.['content-length']);
    if(Number.isFinite(declared)&&declared>MAX_BYTES)throw new PayloadTooLargeException('Deposit proof exceeds 10 MiB');
    return this.objects.uploadStream(
      request.user.userId,
      key,
      request,
      type,
      (request as unknown as {headers?:Record<string,string>}).headers?.['content-length'],
    );
  }
}
