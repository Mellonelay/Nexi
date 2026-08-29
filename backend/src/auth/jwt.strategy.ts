import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { AuthSurface, AuthenticatedUser, JwtPayload } from './auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const surface = payload?.surface ?? 'PUBLIC';
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0 ||
      payload.email !== undefined && payload.email !== null &&
      (typeof payload.email !== 'string' || payload.email.length === 0) ||
      !Object.values(Role).includes(payload.role) ||
      !Object.values<AuthSurface>(['PUBLIC', 'ADMIN']).includes(surface)
    ) {
      throw new UnauthorizedException('Invalid authentication claims');
    }

    if (payload.sid && (this.d1?.isEnabled() || this.prisma)) {
      try {
        if (this.d1?.isEnabled()) {
          const [session, user] = await Promise.all([
            this.d1.getAuthSessionById(payload.sid),
            this.d1.getUserById(payload.sub),
          ]);
          const now = new Date();
          if (!session || !user || user.role !== payload.role || session.userId !== payload.sub || session.surface !== surface || session.revokedAt || now >= new Date(session.absoluteExpiresAt) || now >= new Date(session.idleExpiresAt)) {
            throw new UnauthorizedException('Authentication session is not active');
          }
        } else if (this.prisma) {
          const [session, user] = await Promise.all([
            this.prisma.authSession.findUnique({ where: { id: payload.sid } }),
            this.prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true } }),
          ]);
          const now = new Date();
          if (!session || !user || user.role !== payload.role || session.userId !== payload.sub || session.surface !== surface || session.revokedAt || now >= session.absoluteExpiresAt || now >= session.idleExpiresAt) {
            throw new UnauthorizedException('Authentication session is not active');
          }
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException('Authentication session could not be validated');
      }
    }

    return { userId: payload.sub, email: payload.email, role: payload.role, surface, ...(payload.sid ? { sessionId: payload.sid } : {}) };
  }
}
