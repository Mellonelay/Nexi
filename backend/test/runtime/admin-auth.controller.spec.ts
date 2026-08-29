import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthController } from '../../src/admin/admin-auth.controller';

describe('AdminAuthController', () => {
  it('issues an ADMIN-surface session only for an Admin principal', async () => {
    const authService = {
      validateAdmin: jest.fn().mockResolvedValue({ id: 'admin-1', email: 'admin@example.test', role: 'ADMIN' }),
      login: jest.fn().mockResolvedValue({ access_token: 'admin-token' }),
    };
    const controller = new AdminAuthController(authService as any);

    await expect(controller.login({ email: 'admin@example.test', password: 'password' })).resolves.toEqual({ access_token: 'admin-token' });
    expect(authService.login).toHaveBeenCalledWith(expect.objectContaining({ id: 'admin-1' }), 'ADMIN');
  });

  it('rejects invalid Admin credentials', async () => {
    const authService = { validateAdmin: jest.fn().mockResolvedValue(null) };
    const controller = new AdminAuthController(authService as any);

    await expect(controller.login({ email: 'admin@example.test', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
