import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { D1WorkerBridgeService } from '../d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../d1/local-sqlite-bridge.service';
import { EventOutboxService } from '../events/event-outbox.service';
import { WorkflowCommandsService } from '../workflows/workflow-commands.service';
import { LocalDurableJobStore } from './local-durable-job.store';
import { DurableQueueTransport } from './durable-queue.transport';
import { LocalWorkflowStore } from './local-workflow.store';
import { LocalWorkflowCoordinator } from './local-workflow.coordinator';
import { LocalQueueConsumer } from './local-queue.consumer';

const QUEUE_NAMES = ['domain-events', 'notifications', 'integration-jobs'] as const;

type ValkeyConnectionOptions = {
  path?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: { servername: string; rejectUnauthorized: true };
  maxRetriesPerRequest: number | null;
  enableOfflineQueue?: boolean;
};

/** Supports a private local Unix socket or an explicit TLS Redis-compatible URL. */
export function resolveValkeyConnectionOptions(
  config: Pick<ConfigService, 'get'>,
  maxRetriesPerRequest: number | null,
  enableOfflineQueue?: boolean,
): ValkeyConnectionOptions {
  const endpoint = config.get<string>('NEXI_VALKEY_URL', '')?.trim() ?? '';
  if (endpoint) {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new Error('NEXI_VALKEY_URL is invalid');
    }
    if (!['redis:', 'rediss:'].includes(url.protocol) || !url.hostname) {
      throw new Error('NEXI_VALKEY_URL must use redis:// or rediss://');
    }
    if (url.search || url.hash) throw new Error('NEXI_VALKEY_URL query and fragment parameters are unsupported');
    const port = url.port ? Number(url.port) : 6379;
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('NEXI_VALKEY_URL port is invalid');
    let db: number | undefined;
    if (url.pathname && url.pathname !== '/') {
      if (!/^\/\d+$/.test(url.pathname)) throw new Error('NEXI_VALKEY_URL database path is invalid');
      db = Number(url.pathname.slice(1));
    }
    let username: string | undefined;
    let password: string | undefined;
    try {
      username = url.username ? decodeURIComponent(url.username) : undefined;
      password = url.password ? decodeURIComponent(url.password) : undefined;
    } catch {
      throw new Error('NEXI_VALKEY_URL credentials are malformed');
    }
    return {
      host: url.hostname,
      port,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
      ...(db !== undefined ? { db } : {}),
      ...(url.protocol === 'rediss:' ? { tls: { servername: url.hostname, rejectUnauthorized: true as const } } : {}),
      maxRetriesPerRequest,
      ...(enableOfflineQueue !== undefined ? { enableOfflineQueue } : {}),
    };
  }

  const path = config.get<string>('NEXI_VALKEY_SOCKET', '')?.trim() ?? '';
  if (!path.startsWith('/') || path.includes('\\0')) {
    throw new Error('NEXI_VALKEY_SOCKET must identify an absolute Unix socket');
  }
  return {
    path,
    maxRetriesPerRequest,
    ...(enableOfflineQueue !== undefined ? { enableOfflineQueue } : {}),
  };
}

/**
 * Inactive unless both local SQLite and local asynchronous processing are explicitly enabled.
 * SQLite remains the source of delivery truth; BullMQ/Valkey provide wakeups only.
 * The schema is intentionally NOT applied here: migration and acceptance must precede activation.
 */
@Injectable()
export class LocalAsyncRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocalAsyncRuntimeService.name);
  private readonly queues: Queue[] = [];
  private readonly workers: Worker[] = [];
  private timer?: ReturnType<typeof setInterval>;
  private polling = false;
  private transport?: DurableQueueTransport;
  private workflows?: LocalWorkflowCoordinator;
  private workflowStore?: LocalWorkflowStore;

  constructor(
    private readonly config: ConfigService,
    private readonly bridge: D1WorkerBridgeService,
    private readonly outbox: EventOutboxService,
    private readonly commands: WorkflowCommandsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>('NEXI_LOCAL_ASYNC_ENABLED', 'false') !== 'true') return;
    if (this.config.get<string>('NEXI_SQLITE_LOCAL_ENABLED', 'false') !== 'true' ||
        !(this.bridge instanceof LocalSqliteBridgeService)) {
      throw new Error('Local async execution requires the local SQLite financial bridge');
    }
    const producerConnection = resolveValkeyConnectionOptions(this.config, 1, false);
    const workerConnection = resolveValkeyConnectionOptions(this.config, null);
    // Fail closed unless the additive schema and canonical Inbox were installed beforehand.
    for (const table of ['LocalDurableJob', 'LocalDurableJobReplayHistory', 'LocalWorkflowInstance', 'LocalWorkflowEvent', 'LocalWorkflowStep', 'EventInbox']) {
      const result = await this.bridge.select<{name:string}>(
        'SELECT name FROM sqlite_master WHERE type = ? AND name = ?', ['table',table]);
      if (result.results.length !== 1) throw new Error('Local async schema is not ready');
    }
    try {
      await this.bridge.select('SELECT generation,generationAttempts FROM LocalDurableJob LIMIT 0');
      await this.bridge.select('SELECT journalId,generation,attempts,generationAttempts,lastError,replayedAt FROM LocalDurableJobReplayHistory LIMIT 0');
    } catch {
      throw new Error('Local async schema is not ready');
    }
    const prefix = this.config.get<string>('NEXI_LOCAL_ASYNC_PREFIX', 'nexi-local-async');
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(prefix)) throw Error('Invalid local queue prefix');
    const queueMap: Record<string, Queue> = {};
    for (const name of QUEUE_NAMES) {
      const queue = new Queue(name, {
        connection: producerConnection,
        prefix,
      });
      queue.on('error', () => this.logger.warn('Local queue producer connection error; SQLite journal remains pending'));
      this.queues.push(queue);
      queueMap[name] = queue;
    }
    this.workflowStore = new LocalWorkflowStore(this.bridge);
    this.workflows = new LocalWorkflowCoordinator(this.workflowStore, input => this.commands.execute(input));
    const consumer = new LocalQueueConsumer(this.outbox,this.workflowStore,this.workflows);
    const store = new LocalDurableJobStore(this.bridge);
    this.transport = new DurableQueueTransport(store, queueMap, (event,job) => consumer.execute(event,job));
    for (const name of QUEUE_NAMES) {
      const worker = new Worker(name, async job => {
        if (typeof job.data?.journalId !== 'string') throw Error('Missing durable journal id');
        await this.transport!.process(job.data.journalId);
      }, { connection: workerConnection, concurrency: 1, prefix });
      worker.on('error', () => this.logger.warn('Local queue worker error; durable retry remains available'));
      this.workers.push(worker);
    }
    this.timer = setInterval(() => { void this.cycle(); }, 1000);
    this.timer.unref?.();
    await this.cycle();
  }

  private async cycle(): Promise<void> {
    if (this.polling || !this.transport || !this.workflowStore || !this.workflows) return;
    this.polling = true;
    try {
      await this.transport.dispatchPending();
      for (const row of await this.workflowStore.due(Date.now())) await this.workflows.tick(row.id);
    } catch {
      this.logger.warn('Local async cycle failed; persisted jobs will be retried');
    } finally {
      this.polling = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    for (const worker of this.workers) await worker.close();
    for (const queue of this.queues) await queue.close();
  }
}
