import * as fs from 'node:fs';
import * as path from 'node:path';
import { FinancialOperationsController } from '../../src/financial/financial-operations.controller';

const response = (method: string, status = '201') => {
  const metadata = Reflect.getMetadata(
    'swagger/apiResponse',
    (FinancialOperationsController.prototype as unknown as Record<string, object>)[method],
  ) as Record<string, { schema?: Record<string, any>; description?: string }> | undefined;
  return metadata?.[status];
};
const responseSchema = (method: string) => response(method)?.schema;

describe('Public financial response metadata', () => {
  it('describes the persisted conversion quote envelope and stable replay flag', () => {
    expect(responseSchema('quote')).toMatchObject({
      required: ['quote', 'replayed'],
      properties: {
        quote: { required: ['id', 'userId', 'fromAsset', 'toAsset', 'inputAmount', 'rate', 'outputAmount', 'provider', 'source', 'evidenceId', 'configurationVersion', 'expiresAt', 'state', 'quoteKey', 'acceptanceKey', 'conversionRef', 'createdAt', 'updatedAt'], properties: {
          evidenceId: { type: 'string' }, state: { enum: ['OPEN', 'ACCEPTED', 'EXPIRED', 'REJECTED'] },
          acceptanceKey: { type: 'string', nullable: true }, conversionRef: { type: 'string', nullable: true },
          createdAt: { type: 'string' }, updatedAt: { type: 'string' },
        } },
        replayed: { type: 'boolean' },
      },
    });
  });

  it('describes the private deposit proof upload and authorization responses', () => {
    expect(responseSchema('createDepositProofIntent')).toMatchObject({
      required: ['key', 'uploadPath', 'contentType', 'maxBytes'],
      properties: { maxBytes: { type: 'integer', maximum: 10485760 } },
    });
    expect(responseSchema('authorizeDepositProofUpload')).toMatchObject({
      required: ['authorized', 'key'],
      properties: { authorized: { type: 'boolean', enum: [true] } },
    });
  });

  it('documents account-transfer balances and stable posting identifiers without numeric coercion', () => {
    expect(responseSchema('transferBetweenAccounts')).toMatchObject({
      required: ['transfer', 'balances', 'postings', 'replayed'],
      properties: {
        transfer: { properties: { amount: { type: 'string' }, sourceAccountId: { type: 'string' }, destinationAccountId: { type: 'string' } } },
        balances: { properties: {
          source: { properties: { available: { type: 'string' }, locked: { type: 'string' }, total: { type: 'string' } } },
          destination: { properties: { available: { type: 'string' }, locked: { type: 'string' }, total: { type: 'string' } } },
        } },
        postings: { properties: { debitPostingId: { type: 'string' }, creditPostingId: { type: 'string' }, replayed: { type: 'boolean' } } },
      },
    });
    expect(response('transferBetweenAccounts', '400')?.description).toBeTruthy();
  });

  it('documents persisted conversion acceptance and idempotent replay semantics', () => {
    expect(responseSchema('accept')).toMatchObject({
      required: ['quote', 'replayed'],
      properties: {
        quote: { required: ['id', 'userId', 'fromAsset', 'toAsset', 'inputAmount', 'rate', 'outputAmount', 'provider', 'source', 'evidenceId', 'configurationVersion', 'expiresAt', 'state', 'quoteKey', 'acceptanceKey', 'conversionRef', 'createdAt', 'updatedAt'], properties: {
          inputAmount: { type: 'string' }, outputAmount: { type: 'string' },
          evidenceId: { type: 'string' }, state: { enum: ['OPEN', 'ACCEPTED', 'EXPIRED', 'REJECTED'] },
          acceptanceKey: { type: 'string', nullable: true }, conversionRef: { type: 'string', nullable: true },
        } },
        replayed: { type: 'boolean' },
      },
    });
    expect(response('accept', '400')?.description).toBeTruthy();
    expect(response('accept', '404')?.description).toBeTruthy();
  });

  it('keeps generated OpenAPI aligned with the financial operation response metadata', () => {
    const artifact = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), '../docs/contracts/openapi.json'), 'utf8'));
    for (const route of ['/financial/account-transfers', '/financial/conversion/accept']) {
      expect(artifact.paths[route].post.responses['201'].content['application/json'].schema.required)
        .toEqual(route.endsWith('account-transfers')
          ? ['transfer', 'balances', 'postings', 'replayed']
          : ['quote', 'replayed']);
    }
  });
});
