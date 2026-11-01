import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { CommunicationsService } from '../communications/communications.service';
import { D1WorkerBridgeService } from '../d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../d1/local-sqlite-bridge.service';
import { EventOutboxService } from '../events/event-outbox.service';
import type { NexiEventEnvelope } from '../events/event-envelope';
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
  private cycleDone?: Promise<void>;
  private transport?: DurableQueueTransport;
  private workflows?: LocalWorkflowCoordinator;
  private workflowStore?: LocalWorkflowStore;

  constructor(
    private readonly config: ConfigService,
    private readonly bridge: D1WorkerBridgeService,
    private readonly outbox: EventOutboxService,
    private readonly commands: WorkflowCommandsService,
    @Optional() private readonly communications?: CommunicationsService,
  ) {}

  private async notifyAccountTransfer(event: NexiEventEnvelope): Promise<void> {
    const { userId, asset, amount, sourceScope, destinationScope } = event.payload;
    if (userId === undefined && sourceScope === undefined && destinationScope === undefined) {
      const { fromUserId, toUserId } = event.payload;
      // Non-customer Ledger transfers have no personal notification recipient.
      if (fromUserId === undefined && toUserId === undefined) return;
      if (typeof fromUserId !== 'string' || !fromUserId.trim()
        || typeof toUserId !== 'string' || !toUserId.trim() || fromUserId === toUserId
        || typeof asset !== 'string' || !/^[A-Z0-9]{1,20}$/.test(asset)
        || typeof amount !== 'string' || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(amount)
        || Number(amount) <= 0) throw new Error('Invalid recipient transfer notification event');
      if (!this.communications) throw new Error('Communications are required for transfer notification delivery');
      await this.communications.sendSystemNotification({
        userId: fromUserId, type: 'TRANSFER_COMPLETED', title: 'Transfer sent',
        body: `${amount} ${asset} sent to another NEXI user.`,
        idempotencyKey: `${event.idempotencyKey}:sent`,
      });
      await this.communications.sendSystemNotification({
        userId: toUserId, type: 'TRANSFER_COMPLETED', title: 'Transfer received',
        body: `${amount} ${asset} received from another NEXI user.`,
        idempotencyKey: `${event.idempotencyKey}:received`,
      });
      return;
    }
    if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid wallet transfer notification recipient');
    const scopes = ['MAIN', 'SPOT', 'MARGIN', 'BINARY', 'FINANCE'];
    if (!scopes.includes(String(sourceScope)) || !scopes.includes(String(destinationScope))
      || typeof asset !== 'string' || !/^[A-Z0-9]{1,20}$/.test(asset)
      || typeof amount !== 'string' || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(amount)
      || Number(amount) <= 0) throw new Error('Invalid wallet transfer notification event');
    if (!this.communications) throw new Error('Communications are required for transfer notification delivery');
    const account = (scope: string) => scope === 'MAIN' ? 'Funding' : scope === 'BINARY' ? 'Options' : scope.charAt(0) + scope.slice(1).toLowerCase();
    await this.communications.sendSystemNotification({
      userId, type: 'TRANSFER_COMPLETED',
      title: 'Wallet transfer completed',
      body: `${amount} ${asset} transferred from ${account(String(sourceScope))} to ${account(String(destinationScope))}.`,
      idempotencyKey: event.idempotencyKey,
    });
  }

  private async notifyCustomerEvent(event: NexiEventEnvelope): Promise<void> {
    if (event.type === 'TRANSFER_COMPLETED') return this.notifyAccountTransfer(event);
    if (!this.communications) throw new Error('Communications are required for customer notification delivery');
    const payload = event.payload;
    const field = (name: string): string => {
      const value = payload[name];
      if (typeof value !== 'string' || value.trim() === '') throw new Error(`Invalid ${event.type} notification ${name}`);
      return value;
    };
    let title: string;
    let body: string;
    switch (event.type) {
      case 'DEPOSIT_CREDITED':
        title = 'Deposit confirmed'; body = `${field('amount')} ${field('asset')} credited to Funding.`; break;
      case 'DEPOSIT_REJECTED':
        title = 'Deposit rejected'; body = 'Your deposit was rejected. Review your deposit activity for details.'; break;
      case 'WITHDRAWAL_APPROVED':
        title = 'Withdrawal approved'; body = `Your ${field('asset')} withdrawal was approved for processing.`; break;
      case 'WITHDRAWAL_RESERVED':
        title = 'Withdrawal requested'; body = `${field('amount')} ${field('asset')} withdrawal requested on ${field('network')}.`; break;
      case 'WITHDRAWAL_SETTLED':
        title = 'Withdrawal completed'; body = `${field('amount')} ${field('asset')} withdrawal completed.`; break;
      case 'BINARY_POSITION_OPENED':
        title = 'Options position opened'; body = `${field('side')} on ${field('pair')}: ${field('stake')} USDT stake reserved.`; break;
      case 'BINARY_POSITION_SETTLED':
        title = 'Options position settled'; body = `${field('state')}: ${field('stake')} ${field('asset')} stake, ${field('payout')} ${field('asset')} payout.`; break;
      case 'SPOT_ORDER_RESERVED':
        title = 'Spot order accepted'; body = `${field('side')} ${field('pair')}: ${field('amount')} order quantity reserved.`; break;
      case 'CONVERSION_ACCEPTED':
        title = 'Conversion completed'; body = `${field('inputAmount')} ${field('fromAsset')} converted to ${field('outputAmount')} ${field('toAsset')}.`; break;
      case 'SPOT_TRADE_EXECUTED':
        title = 'Spot trade executed'; body = `${field('amount')} units of ${field('pair')} traded at ${field('price')}.`; break;
      case 'SPOT_ORDER_CANCELLED':
        title = 'Spot order cancelled'; body = `Order ${field('orderId')} was cancelled.`; break;
      case 'DEPOSIT_CLAIM_SUBMITTED':
        title = 'Deposit claim submitted'; body = `${field('claimedAmount')} ${field('asset')} deposit claim submitted for review on ${field('network')}.`; break;
      case 'DEPOSIT_CLAIM_APPROVED':
        title = 'Deposit claim approved'; body = 'Your deposit claim was approved for processing.'; break;
      case 'DEPOSIT_CLAIM_REJECTED':
        title = 'Deposit claim rejected'; body = 'Your deposit claim was rejected. Check your deposit activity for details.'; break;
      case 'DEPOSIT_CLAIM_CREDITED':
        title = 'Deposit claim credited'; body = `${field('amount')} ${field('asset')} credited to Funding.`; break;
      case 'WITHDRAWAL_REJECTED':
        title = 'Withdrawal rejected'; body = `Your ${field('asset')} withdrawal was rejected and reserved funds released.`; break;
      case 'WITHDRAWAL_FAILED':
        title = 'Withdrawal failed'; body = `Your ${field('asset')} withdrawal failed and reserved funds released.`; break;
      case 'LOAN_APPLICATION_SUBMITTED':
        title = 'Loan application submitted'; body = 'Your loan application was submitted for review.'; break;
      case 'LOAN_APPROVED':
        title = 'Loan approved'; body = 'Your loan was approved and disbursement was recorded. Review your loan obligations.'; break;
      case 'LOAN_REJECTED':
        title = 'Loan rejected'; body = 'Your loan application was rejected. Review your loan history.'; break;
      case 'LOAN_OVERDUE':
        title = 'Loan repayment overdue'; body = 'Your loan repayment is overdue. Review your loan obligations.'; break;
      case 'KYC_SUBMITTED':
        title = 'Identity verification submitted'; body = 'Your identity verification is awaiting review.'; break;
      case 'KYC_DECISION': {
        const decision = field('decision');
        if (decision !== 'APPROVED' && decision !== 'REJECTED') throw new Error('Invalid KYC decision notification event');
        title = `Identity verification ${decision.toLowerCase()}`;
        body = decision === 'APPROVED' ? 'Your identity verification was approved.' : 'Your identity verification was rejected. Review your verification status.';
        break;
      }
      case 'MARGIN_POSITION_OPENED':
        title = 'Margin position opened'; body = `Margin position on ${field('pair')} opened.`; break;
      case 'MARGIN_CLOSED':
        title = 'Margin position closed'; body = 'Your Margin position was closed. Review Activity for settlement details.'; break;
      case 'MARGIN_LIQUIDATED':
        title = 'Margin position liquidated'; body = 'Your Margin position was liquidated. Review Activity for settlement details.'; break;
      case 'MARGIN_INTEREST_ACCRUED':
        title = 'Margin interest accrued'; body = `${field('amount')} ${field('asset')} interest accrued on your Margin position.`; break;
      case 'MINING_SUBSCRIPTION_OPENED':
        title = 'Earn allocation opened'; body = `${field('amount')} allocated to your Earn product.`; break;
      case 'MINING_REWARD_POSTED':
        title = 'Earn reward credited'; body = `${field('amount')} ${field('currency')} reward credited.`; break;

      default: return;
    }
    const users = event.type === 'SPOT_TRADE_EXECUTED'
      ? [...new Set([field('buyerUserId'), field('sellerUserId')])]
      : [field('userId')];
    for (const userId of users) {
      await this.communications.sendSystemNotification({
        userId, type: event.type, title, body,
        idempotencyKey: `${event.idempotencyKey}:${userId}`,
      });
    }
  }

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
    const consumer = new LocalQueueConsumer(this.outbox,this.workflowStore,this.workflows,Date.now,event => this.notifyCustomerEvent(event));
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

  private cycle(): Promise<void> {
    if (this.polling || !this.transport || !this.workflowStore || !this.workflows) {
      return this.cycleDone ?? Promise.resolve();
    }
    this.polling = true;
    this.cycleDone = (async () => {
      try {
        await this.transport!.dispatchPending();
        for (const row of await this.workflowStore!.due(Date.now())) await this.workflows!.tick(row.id);
      } catch {
        this.logger.warn('Local async cycle failed; persisted jobs will be retried');
      } finally {
        this.polling = false;
      }
    })();
    return this.cycleDone;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    if (this.cycleDone) await this.cycleDone;
    for (const worker of this.workers) await worker.close();
    for (const queue of this.queues) await queue.close();
  }
}
