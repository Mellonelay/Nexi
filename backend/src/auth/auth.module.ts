import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OwnershipGuard } from './ownership.guard';
import { DevelopmentOnlyGuard } from './development-only.guard';
import { RefreshTokenCryptoService } from './refresh-token-crypto.service';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { RedisRateLimitService } from './redis-rate-limit.service';
import { AuthSurfaceGuard } from './auth-surface.guard';
import { AuthSessionService } from './auth-session.service';
import { AuthSecurityEventsService } from './auth-security-events.service';
import { WalletAuthService } from './wallet-auth.service';
import { D1PrismaModule } from '../d1/d1-prisma.module';
import { ReferralVipModule } from '../referral-vip/referral-vip.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    D1PrismaModule,
    ReferralVipModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, WalletAuthService, JwtStrategy, RolesGuard, JwtAuthGuard, OwnershipGuard, DevelopmentOnlyGuard, RefreshTokenCryptoService, AuthSecurityEventsService, AuthSessionService, RedisRateLimitService, AuthRateLimitGuard, AuthSurfaceGuard],
  controllers: [AuthController],
  exports: [AuthService, WalletAuthService, RolesGuard, JwtAuthGuard, OwnershipGuard, DevelopmentOnlyGuard, RefreshTokenCryptoService, AuthSecurityEventsService, AuthSessionService, RedisRateLimitService, AuthRateLimitGuard, AuthSurfaceGuard, JwtModule],
})
export class AuthModule {}
