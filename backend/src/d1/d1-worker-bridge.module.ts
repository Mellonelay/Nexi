import { Global, Module } from '@nestjs/common';
import { D1WorkerBridgeService } from './d1-worker-bridge.service';

@Global()
@Module({
  providers: [D1WorkerBridgeService],
  exports: [D1WorkerBridgeService],
})
export class D1WorkerBridgeModule {}
