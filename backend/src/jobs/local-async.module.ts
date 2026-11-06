import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { CommunicationsModule } from '../communications/communications.module';
import { ReferralVipModule } from '../referral-vip/referral-vip.module';
import { WorkflowCommandsModule } from '../workflows/workflow-commands.module';
import { LocalAsyncRuntimeService } from './local-async-runtime.service';

/** Always importable; zero transport connections unless explicitly enabled. */
@Module({
  imports: [EventsModule, CommunicationsModule, ReferralVipModule, WorkflowCommandsModule],
  providers: [LocalAsyncRuntimeService],
})
export class LocalAsyncModule {}
