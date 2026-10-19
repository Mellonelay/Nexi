import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { D1WorkerBridgeService } from './d1-worker-bridge.service';
import { LocalSqliteBridgeService } from './local-sqlite-bridge.service';

/** SQLite-only provider; existing DI token retained for domain compatibility. */
@Global()
@Module({
  providers: [{
    provide: D1WorkerBridgeService,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => new LocalSqliteBridgeService(config),
  }],
  exports: [D1WorkerBridgeService],
})
export class D1WorkerBridgeModule {}
