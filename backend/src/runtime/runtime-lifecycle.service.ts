import { BeforeApplicationShutdown, Injectable, Logger } from '@nestjs/common';

export interface ClosableRuntimeResource {
  close(): Promise<void>;
}

@Injectable()
export class RuntimeLifecycleService implements BeforeApplicationShutdown {
  private readonly logger = new Logger(RuntimeLifecycleService.name);
  private socketAdapter?: ClosableRuntimeResource;

  registerSocketAdapter(socketAdapter: ClosableRuntimeResource): void {
    this.socketAdapter = socketAdapter;
  }

  async beforeApplicationShutdown(): Promise<void> {
    if (!this.socketAdapter) {
      return;
    }

    await this.socketAdapter.close();
    this.logger.log('Socket.IO Redis adapter closed');
  }
}
