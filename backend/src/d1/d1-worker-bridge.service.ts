import { Injectable } from '@nestjs/common';

export type D1BridgeResult<T> = {
  results: T[];
  meta?: Record<string, unknown>;
};

export type D1BridgeParameter = string | number | boolean | null;

export type D1BridgeBatchStatement = {
  sql: string;
  params?: D1BridgeParameter[];
};

export type D1BridgeBatchResult = {
  results: Array<{
    success?: boolean;
    meta?: Record<string, unknown>;
    results?: unknown[];
  }>;
  meta?: Record<string, unknown>;
};

/** Compatibility token for the SQLite-only bridge implementation. */
@Injectable()
export abstract class D1WorkerBridgeService {
  abstract isEnabled(): boolean;
  abstract health(): Promise<boolean>;
  abstract select<T>(sql: string, params?: Array<string | number | null>): Promise<D1BridgeResult<T>>;
  abstract batch(statements: D1BridgeBatchStatement[]): Promise<D1BridgeBatchResult>;
}
