import { D1CommunicationsCommandGateway } from '../../src/d1/d1-communications-command.gateway';

describe('persistent message conversation D1 command boundary', () => {
  const previous = process.env.D1_RUNTIME_ENABLED;

  it('resolves Admin moderation and records its event in one D1 batch', async () => {
    process.env.D1_RUNTIME_ENABLED = 'true';
    const bridge: any = {
      isEnabled: () => true,
      batch: jest.fn(async () => ({ results: [{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 1 } }] })),
    };
    const gateway = new D1CommunicationsCommandGateway(bridge);

    const changed = await gateway.resolveMessageModeration({
      id: 'case-1',
      conversationId: 'conversation:user-1:user-2',
      adminId: 'admin-1',
      status: 'RESOLVED',
      resolution: 'reviewed',
      conversationState: 'RESTRICTED',
      idempotencyKey: 'review-1',
    });

    expect(changed).toBe(true);
    const statements = bridge.batch.mock.calls[0][0];
    expect(statements).toHaveLength(3);
    expect(statements[0].sql).toContain('UPDATE "MessageModerationCase"');
    expect(statements[1].sql).toContain('UPDATE "MessageConversation"');
    expect(statements[2].sql).toContain('INSERT OR IGNORE INTO "EventOutbox"');
    expect(statements[2].params).toEqual(expect.arrayContaining([
      'message-moderation:case-1:review-1',
      'MESSAGE_MODERATION',
      'case-1',
      'MESSAGE_MODERATION_RESOLVED',
    ]));
  });
  it('preserves the existing moderation resolution when an update omits one', async () => {
    const bridge: any = {
      isEnabled: () => true,
      batch: jest.fn(async () => ({ results: [{ meta: { changes: 1 } }, { meta: { changes: 1 } }] })),
    };
    const gateway = new D1CommunicationsCommandGateway(bridge);

    await gateway.resolveMessageModeration({
      id: 'case-1',
      conversationId: 'conversation:user-1:user-2',
      adminId: 'admin-1',
      status: 'OPEN',
      idempotencyKey: 'review-2',
    });

    const [update] = bridge.batch.mock.calls[0][0];
    expect(update.sql).toContain('COALESCE(?, "resolution")');
    expect(update.params).toEqual(['OPEN', null, 'admin-1', 'case-1']);
  });

  beforeEach(() => { process.env.D1_RUNTIME_ENABLED = 'true'; });
  afterEach(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it('batches conversation, message, timestamp, and EventOutbox in one D1 command', async () => {
    const bridge: any = {
      isEnabled: () => true,
      batch: jest.fn(async () => ({ results: [{}, { meta: { changes: 1 } }, {}, { meta: { changes: 1 } }] })),
    };
    const gateway = new D1CommunicationsCommandGateway(bridge);
    const created = await gateway.sendMessage({
      id: 'message-1',
      conversationId: 'conversation:user-1:user-2',
      participantAId: 'user-1',
      participantBId: 'user-2',
      senderId: 'user-2',
      recipientId: 'user-1',
      body: 'Hello',
      idempotencyKey: 'message:message-1',
    });

    expect(created).toBe(true);
    const statements = bridge.batch.mock.calls[0][0];
    expect(statements).toHaveLength(4);
    expect(statements[0].sql).toContain('MessageConversation');
    expect(statements[1].sql).toContain('PersistentMessage');
    expect(statements[1].sql).toContain('MAX("sequence")');
    expect(statements[2].sql).toContain('MessageConversation');
    expect(statements[3].sql).toContain('EventOutbox');
    expect(statements[3].params).toEqual(expect.arrayContaining([
      'message:message-1',
      'PERSISTENT_MESSAGE',
      'message-1',
      'MESSAGE_SENT',
    ]));
  });
});
