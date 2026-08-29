import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { AuthSurface } from './auth.types';

export type AuthSecurityEventType =
  | 'LOGIN_SUCCEEDED'
  | 'REFRESH_SUCCEEDED'
  | 'REFRESH_REJECTED'
  | 'REFRESH_REUSE_DETECTED'
  | 'LOGOUT'
  | 'LOGOUT_ALL';

export interface AuthSecurityEvent {
  readonly type: AuthSecurityEventType;
  readonly occurredAt: Date;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly surface?: AuthSurface;
  readonly reason?: string;
}

/** Emits redacted authentication lifecycle events; raw credentials never enter the event payload. */
@Injectable()
export class AuthSecurityEventsService {
  private readonly emitter = new EventEmitter();

  on(listener: (event: AuthSecurityEvent) => void): () => void {
    this.emitter.on('auth.security', listener);
    return () => this.emitter.off('auth.security', listener);
  }

  emit(event: AuthSecurityEvent): void {
    this.emitter.emit('auth.security', event);
  }
}
