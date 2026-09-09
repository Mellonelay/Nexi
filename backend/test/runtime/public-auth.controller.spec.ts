import { AuthController } from '../../src/auth/auth.controller';

function responseDouble() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('Public authentication controller contract', () => {
  it('does not expose public email/password login or signup routes', () => {
    const controller = new AuthController({} as never);

    expect((controller as unknown as { login?: unknown }).login).toBeUndefined();
    expect((controller as unknown as { signup?: unknown }).signup).toBeUndefined();
  });

  it('establishes wallet sessions by setting an HttpOnly Secure refresh cookie', async () => {
    const response = responseDouble();
    const walletAuth = {
      verifyChallenge: jest.fn().mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        profile: { id: '100001' },
      }),
    };
    const controller = new AuthController({} as never, walletAuth as never);

    const result = await controller.walletVerify({ message: 'siwe', signature: '0xsigned' }, {} as never, response as never);

    expect(result).toEqual({ access_token: 'access-token', profile: { id: '100001' } });
    expect(response.cookie).toHaveBeenCalledWith('nexi_public_refresh', 'refresh-token', expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    }));
  });

  it('rotates the public cookie without accepting a refresh token from the request body', async () => {
    const response = responseDouble();
    const authService = {
      refresh: jest.fn().mockResolvedValue({ access_token: 'next-access', refresh_token: 'next-refresh', user: { id: '100001' } }),
    };
    const controller = new AuthController(authService as never);

    const result = await controller.refresh({ headers: { cookie: 'nexi_public_refresh=refresh-token' } } as never, response as never);

    expect(authService.refresh).toHaveBeenCalledWith('refresh-token', 'PUBLIC');
    expect(result).toEqual({ access_token: 'next-access', user: { id: '100001' } });
    expect(response.cookie).toHaveBeenCalledWith('nexi_public_refresh', 'next-refresh', expect.objectContaining({ httpOnly: true, secure: true }));
  });

  it('clears the public cookie on logout and logout-all', async () => {
    const response = responseDouble();
    const authService = {
      logout: jest.fn().mockResolvedValue({ revoked: true }),
      logoutAll: jest.fn().mockResolvedValue({ revokedCount: 1 }),
    };
    const controller = new AuthController(authService as never);
    const request = { user: { userId: 'user-1', surface: 'PUBLIC', sessionId: 'session-1' } } as never;

    await controller.logout(request, response as never);
    await controller.logoutAll(request, response as never);

    expect(response.clearCookie).toHaveBeenCalledTimes(2);
    expect(response.clearCookie).toHaveBeenCalledWith('nexi_public_refresh', expect.objectContaining({ path: '/', secure: true }));
  });
});
