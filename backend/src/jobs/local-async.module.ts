import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { WorkflowCommandsModule } from '../workflows/workflow-commands.module';
import { LocalAsyncRuntimeService } from './local-async-runtime.service';

/** Always importable; zero transport connections unless explicitly enabled. */
@Module({
  imports: [EventsModule, WorkflowCommandsModule],
  providers: [LocalAsyncRuntimeService],
})
export class LocalAsyncModule {}
