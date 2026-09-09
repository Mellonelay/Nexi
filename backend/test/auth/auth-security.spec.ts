import { UnauthorizedException } from '@nestjs/common';
import { AuthSecurityEventsService, AuthSecurityEvent } from '../../src/auth/auth-security-events.service';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { AuthSessionService } from '../../src/auth/auth-session.service';
import { FinancialOperationsController } from '../../src/financial/financial-operations.controller';
import { TOTP } from 'otpauth';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((value: string) => `hashed-${value}`),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('A20 Security backend contract', () => {
  describe('UsersService.changeSecurityPassword', () => {
    const makePrisma = (user: any) => ({
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({ ...data })),
      },
    });

    it('rejects when the current security password is wrong', async () => {
      const { compare } = require('bcrypt');
      compare.mockResolvedValue(false);
      const service = new UsersService(makePrisma({ id: 'user-1', securityPasswordHash: 'hashed' }) as any, {} as any);
      await expect(service.changeSecurityPassword('user-1', 'wrong', 'newpassword123456')).rejects.toThrow('Current security password is incorrect');
      compare.mockResolvedValue(true);
    });

    it('updates only the separate security password hash on D1 runtime', async () => {
      const { hash } = require('bcrypt');
      hash.mockClear();
      const d1 = {
        isEnabled: jest.fn().mockReturnValue(true),
        getUserById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed', password: 'admin-login-hash' }),
        updateUserSecurityPassword: jest.fn().mockResolvedValue({ id: 'user-1' }),
      };
      const service = new UsersService({} as any, {} as any, d1 as any);
      await expect(service.changeSecurityPassword('user-1', 'currentpassword123456', 'newpassword123456')).resolves.toBeUndefined();
      expect(d1.updateUserSecurityPassword).toHaveBeenCalledWith('user-1', expect.stringMatching(/^hashed-/));
      expect(hash).toHaveBeenCalledWith('newpassword123456', 12);
    });

    it('sets a security password for a wallet-created user without changing the login password', async () => {
      const { hash } = require('bcrypt');
      hash.mockClear();
      const d1 = {
        isEnabled: jest.fn().mockReturnValue(true),
        getUserById: jest.fn().mockResolvedValue({ id: 'wallet-user', password: null, securityPasswordHash: null }),
        updateUserSecurityPassword: jest.fn().mockResolvedValue({ id: 'wallet-user' }),
      };
      const service = new UsersService({} as any, {} as any, d1 as any);

      await expect(service.changeSecurityPassword('wallet-user', undefined, 'newpassword123456')).resolves.toBeUndefined();
      expect(d1.updateUserSecurityPassword).toHaveBeenCalledWith('wallet-user', expect.stringMatching(/^hashed-/));
      expect(hash).toHaveBeenCalledWith('newpassword123456', 12);
    });

    it('requires the current security password when changing an existing security password', async () => {
      const service = new UsersService({} as any, {} as any, {
        isEnabled: jest.fn().mockReturnValue(true),
        getUserById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed' }),
      } as any);

      await expect(service.changeSecurityPassword('user-1', undefined, 'newpassword123456')).rejects.toThrow('Current security password is required');
    });
  });

  describe('AuthService security-password lifecycle', () => {
    it('changes the separate security password, revokes sessions, and emits a redacted event', async () => {
      const events: AuthSecurityEvent[] = [];
      const securityEvents = new AuthSecurityEventsService();
      securityEvents.on((event) => events.push(event));

      const sessionService = {
        revokeAll: jest.fn().mockResolvedValue({ revokedCount: 2 }),
      } as unknown as AuthSessionService;

      const usersService = {
        changeSecurityPassword: jest.fn().mockResolvedValue(undefined),
      } as unknown as UsersService;

      const service = new AuthService(usersService, {} as any, sessionService, securityEvents);

      await service.changeSecurityPassword('user-1', 'currentpassword123456', 'newpassword123456');

      expect(usersService.changeSecurityPassword).toHaveBeenCalledWith('user-1', 'currentpassword123456', 'newpassword123456');
      expect(sessionService.revokeAll).toHaveBeenCalledWith('user-1', 'PUBLIC');
      expect(sessionService.revokeAll).not.toHaveBeenCalledWith('user-1', 'ADMIN');
      expect(events).toEqual([expect.objectContaining({ type: 'SECURITY_PASSWORD_CHANGED', userId: 'user-1' })]);
    });
  });

  describe('AuthService MFA lifecycle', () => {
    it('generates a TOTP setup payload without enabling MFA', async () => {
      const usersService = {
        updateUserMfa: jest.fn().mockResolvedValue({}),
        getUserMfa: jest.fn().mockResolvedValue(null),
      } as unknown as UsersService;

      const service = new AuthService(usersService, {} as any, undefined, new AuthSecurityEventsService());

      const result = await service.setupMfa('user-1', 'user@example.com');

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('uri');
      expect(result.uri).toContain('otpauth://totp/NEXI:user%40example.com');
      expect(usersService.updateUserMfa).toHaveBeenCalledWith('user-1', false, expect.any(String), null);
    });

    it('verifies a correct TOTP token and enables MFA', async () => {
      const totp = new TOTP({
        issuer: 'NEXI',
        label: 'user-1',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: 'JBSWY3DPEHPK3PXP',
      });
      const token = totp.generate();

      const usersService = {
        updateUserMfa: jest.fn().mockResolvedValue({}),
        getUserMfa: jest.fn().mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', enabled: false }),
      } as unknown as UsersService;

      const service = new AuthService(usersService, {} as any, undefined, new AuthSecurityEventsService());

      const result = await service.verifyMfaSetup('user-1', token);

      expect(result).toEqual({ enabled: true });
      expect(usersService.updateUserMfa).toHaveBeenCalledWith('user-1', true, 'JBSWY3DPEHPK3PXP', null);
    });

    it('rejects invalid MFA tokens during setup', async () => {
      const usersService = {
        updateUserMfa: jest.fn().mockResolvedValue({}),
        getUserMfa: jest.fn().mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', enabled: false }),
      } as unknown as UsersService;

      const service = new AuthService(usersService, {} as any, undefined, new AuthSecurityEventsService());

      await expect(service.verifyMfaSetup('user-1', '000000')).rejects.toThrow('Invalid MFA token');
    });

    it('disables MFA after password and token verification', async () => {
      const { compare } = require('bcrypt');
      compare.mockResolvedValue(true);
      const totp = new TOTP({
        issuer: 'NEXI',
        label: 'user-1',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: 'JBSWY3DPEHPK3PXP',
      });
      const token = totp.generate();
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed' }),
        getUserMfa: jest.fn().mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', enabled: true }),
        updateUserMfa: jest.fn().mockResolvedValue({}),
      } as unknown as UsersService;

      const service = new AuthService(usersService, {} as any, undefined, new AuthSecurityEventsService());

      const result = await service.disableMfa('user-1', 'password123456', token);

      expect(result).toEqual({ enabled: false });
      expect(usersService.updateUserMfa).toHaveBeenCalledWith('user-1', false, null, null);
      compare.mockResolvedValue(false);
    });

    it('requires password to disable MFA', async () => {
      const { compare } = require('bcrypt');
      compare.mockResolvedValue(false);
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed' }),
        getUserMfa: jest.fn().mockResolvedValue({ secret: 'JBSWY3DPEHPK3PXP', enabled: true }),
        updateUserMfa: jest.fn().mockResolvedValue({}),
      } as unknown as UsersService;

      const service = new AuthService(usersService, {} as any, undefined, new AuthSecurityEventsService());

      await expect(service.disableMfa('user-1', 'wrongpassword', '000000')).rejects.toThrow('Security password is incorrect');
      compare.mockResolvedValue(true);
    });
  });

  describe('AuthService sensitive-action verification', () => {
    it('rejects sensitive actions when the security password is missing or wrong', async () => {
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed' }),
        getUserMfa: jest.fn().mockResolvedValue({ enabled: false }),
      } as unknown as UsersService;
      const service = new AuthService(usersService, {} as any);

      await expect(service.verifySensitiveAction('user-1', '')).rejects.toBeInstanceOf(UnauthorizedException);
      const { compare } = require('bcrypt');
      compare.mockResolvedValue(false);
      await expect(service.verifySensitiveAction('user-1', 'wrong')).rejects.toThrow('Sensitive action confirmation failed');
      compare.mockResolvedValue(true);
    });

    it('requires and validates a TOTP second factor when MFA is enabled', async () => {
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed' }),
        getUserMfa: jest.fn().mockResolvedValue({ enabled: true, secret: 'JBSWY3DPEHPK3PXP', backupCodes: null }),
        updateUserMfa: jest.fn().mockResolvedValue({}),
      } as unknown as UsersService;
      const service = new AuthService(usersService, {} as any);

      await expect(service.verifySensitiveAction('user-1', 'correct')).rejects.toThrow('MFA token is required');
      await expect(service.verifySensitiveAction('user-1', 'correct', '000000')).rejects.toThrow('Invalid MFA token');
      const token = new TOTP({ issuer: 'NEXI', label: 'user-1', algorithm: 'SHA1', digits: 6, period: 30, secret: 'JBSWY3DPEHPK3PXP' }).generate();
      await expect(service.verifySensitiveAction('user-1', 'correct', token)).resolves.toBeUndefined();
    });

    it('consumes a recovery code as the MFA second factor', async () => {
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 'user-1', securityPasswordHash: 'hashed' }),
        getUserMfa: jest.fn().mockResolvedValue({ enabled: true, secret: 'JBSWY3DPEHPK3PXP', backupCodes: JSON.stringify(['hashed-recovery']) }),
        updateUserMfa: jest.fn().mockResolvedValue({}),
      } as unknown as UsersService;
      const service = new AuthService(usersService, {} as any);

      await expect(service.verifySensitiveAction('user-1', 'correct', 'RECOVERY01')).resolves.toBeUndefined();
      expect(usersService.updateUserMfa).toHaveBeenCalledWith('user-1', true, 'JBSWY3DPEHPK3PXP', JSON.stringify([]));
    });

    it('reports the separate security password in security state', async () => {
      const usersService = {
        findById: jest.fn().mockResolvedValue({ id: 'user-1', password: 'login-hash', securityPasswordHash: 'security-hash' }),
        getUserMfa: jest.fn().mockResolvedValue(null),
      } as unknown as UsersService;
      const service = new AuthService(usersService, {} as any);

      await expect(service.getSecurityState('user-1')).resolves.toEqual({ passwordSet: true, mfa: { enabled: false, hasSecret: false, hasBackupCodes: false } });
    });
  });

  describe('FinancialOperationsController withdrawal confirmation boundary', () => {
    const request = { user: { userId: 'user-1', surface: 'PUBLIC' } } as any;
    const body = {
      asset: 'USDT', network: 'TRC20', address: 'T-address', amount: '10', idempotencyKey: 'withdraw-key-1',
      securityPassword: 'secret-value', mfaToken: '123456',
    };

    it('rejects a missing or wrong confirmation before entering the financial service', async () => {
      const financial = { requestWithdrawal: jest.fn() };
      const auth = { verifySensitiveAction: jest.fn().mockRejectedValue(new UnauthorizedException('Sensitive action confirmation failed')) };
      const controller = new FinancialOperationsController(financial as any, auth as any);

      await expect(controller.requestWithdrawal({ ...body, securityPassword: undefined } as any, request)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(controller.requestWithdrawal(body as any, request)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(financial.requestWithdrawal).not.toHaveBeenCalled();
    });

    it('verifies confirmation and strips credentials from the financial command', async () => {
      const financial = { requestWithdrawal: jest.fn().mockResolvedValue({ withdrawal: { id: 'withdrawal-1' } }) };
      const auth = { verifySensitiveAction: jest.fn().mockResolvedValue(undefined) };
      const controller = new FinancialOperationsController(financial as any, auth as any);

      await controller.requestWithdrawal(body as any, request);

      expect(auth.verifySensitiveAction).toHaveBeenCalledWith('user-1', 'secret-value', '123456');
      expect(financial.requestWithdrawal).toHaveBeenCalledWith('user-1', {
        asset: 'USDT', network: 'TRC20', address: 'T-address', amount: '10', idempotencyKey: 'withdraw-key-1',
      });
      expect(financial.requestWithdrawal.mock.calls[0][1]).not.toHaveProperty('securityPassword');
      expect(financial.requestWithdrawal.mock.calls[0][1]).not.toHaveProperty('mfaToken');
    });
  });
});
