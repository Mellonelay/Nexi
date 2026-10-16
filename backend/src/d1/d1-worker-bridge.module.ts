import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { D1WorkerBridgeService } from './d1-worker-bridge.service';
import { LocalSqliteBridgeService } from './local-sqlite-bridge.service';

/** D1 remains the default. A local financial bridge requires an explicit opt-in. */
@Global()
@Module({
  providers: [
    {
      provide: D1WorkerBridgeService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('NEXI_SQLITE_LOCAL_ENABLED', 'false') === 'true'
          ? new LocalSqliteBridgeService(config)
          : new D1WorkerBridgeService(config),
    },
  ],
  exports: [D1WorkerBridgeService],
})
export class D1WorkerBridgeModule {}
