import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, SignupDto } from './auth.dto';
import { AuthSurface, LoginUser } from './auth.types';
import { Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuthSessionService } from './auth-session.service';
import type { AuthSessionMetadata } from './auth-session.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Optional() private readonly authSessionService?: AuthSessionService,
  ) {}

  async validateUser(credentials: LoginDto): Promise<LoginUser | null> {
    const user = await this.usersService.findOne(credentials.email);
    if (user?.password && (await bcrypt.compare(credentials.password, user.password))) {
      return {
        id: user.id,
        publicId: user.userCode.toString(),
        email: user.email,
        role: user.role,
        kycStatus: user.kyc?.status ?? 'NOT_SUBMITTED',
      };
    }
    return null;
  }

  async validateAdmin(credentials: LoginDto): Promise<LoginUser | null> {
    const user = await this.validateUser(credentials);
    return user?.role === Role.ADMIN ? user : null;
  }

  async login(user: LoginUser, surface: AuthSurface = 'PUBLIC', metadata: AuthSessionMetadata = {}) {
    const session = this.authSessionService
      ? Object.keys(metadata).length > 0
        ? await this.authSessionService.createSession(user.id, surface, metadata)
        : await this.authSessionService.createSession(user.id, surface)
      : undefined;
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      surface,
      ...(session ? { sid: session.sessionId, jti: randomUUID() } : {}),
    };
    return {
      access_token: this.jwtService.sign(payload),
      ...(session ? { refresh_token: session.refreshToken } : {}),
      user: {
          id: user.publicId ?? user.id,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus || 'NOT_SUBMITTED'
      }
    };
  }

  async signup(data: SignupDto) {
    const user = await this.usersService.createUser(data);
    return this.login({ id: user.id, publicId: user.userCode.toString(), email: user.email, role: user.role });
  }

  async refresh(refreshToken: string, surface: AuthSurface) {
    if (!this.authSessionService) {
      throw new UnauthorizedException('Session persistence is unavailable');
    }
    const rotated = await this.authSessionService.rotate(refreshToken, surface);
    const user = await this.usersService.findById(rotated.userId);
    if (!user || (surface === 'ADMIN' && user.role !== Role.ADMIN)) {
      await this.authSessionService.revokeSession(rotated.userId, surface, rotated.sessionId, 'SECURITY_ACTION');
      throw new UnauthorizedException('Authentication principal is not authorized');
    }
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      surface,
      sid: rotated.sessionId,
      jti: randomUUID(),
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: rotated.refreshToken,
      user: { id: user.userCode.toString(), email: user.email, role: user.role, kycStatus: 'NOT_SUBMITTED' },
    };
  }

  async logout(user: { userId: string; surface?: AuthSurface; sessionId?: string }) {
    if (!this.authSessionService || !user.surface || !user.sessionId) {
      throw new UnauthorizedException('Authentication session is missing');
    }
    return this.authSessionService.revokeSession(user.userId, user.surface, user.sessionId);
  }

  async logoutAll(user: { userId: string; surface?: AuthSurface }) {
    if (!this.authSessionService || !user.surface) {
      throw new UnauthorizedException('Authentication session is missing');
    }
    return this.authSessionService.revokeAll(user.userId, user.surface);
  }
}
