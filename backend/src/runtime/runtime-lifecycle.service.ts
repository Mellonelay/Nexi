import { BeforeApplicationShutdown, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

export interface ClosableRuntimeResource {
  close(): Promise<void>;
}

@Injectable()
export class RuntimeLifecycleService implements BeforeApplicationShutdown, OnApplicationShutdown {
  private readonly logger = new Logger(RuntimeLifecycleService.name);
  private socketAdapter?: ClosableRuntimeResource;
  private shutdownFallback?: NodeJS.Timeout;

  registerSocketAdapter(socketAdapter: ClosableRuntimeResource): void {
    this.socketAdapter = socketAdapter;
  }

  async beforeApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Runtime shutdown stage: beforeApplicationShutdown signal=${signal ?? 'unknown'}`);
    if (this.socketAdapter) {
      await this.socketAdapter.close();
      this.logger.log('Socket.IO Redis adapter closed');
    }
    this.logActiveHandles('after application shutdown hooks');
  }

  onApplicationShutdown(signal?: string): void {
    this.logger.log(`Runtime shutdown stage: onApplicationShutdown signal=${signal ?? 'unknown'}`);
    if (!signal) return;
    this.shutdownFallback = setTimeout(() => {
      this.logActiveHandles('hard-exit fallback');
      this.logger.error('Runtime shutdown exceeded 8s; forcing process exit after cleanup evidence.');
      process.exit(0);
    }, 8_000);
    this.shutdownFallback.unref?.();
  }

  private logActiveHandles(stage: string): void {
    const diagnostics = process as NodeJS.Process & {
      _getActiveHandles?: () => unknown[];
      _getActiveRequests?: () => unknown[];
    };
    const handles = diagnostics._getActiveHandles?.() ?? [];
    const requests = diagnostics._getActiveRequests?.() ?? [];
    const types = handles.map((handle) => (handle as { constructor?: { name?: string } }).constructor?.name ?? typeof handle);
    this.logger.log(`Runtime shutdown handles stage=${stage} handles=${handles.length} requests=${requests.length} types=${types.join(',') || 'none'}`);
  }
}
