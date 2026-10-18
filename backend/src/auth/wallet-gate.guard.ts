import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { verify } from 'crypto';
import { D1PrismaService } from '../d1/d1-prisma.service';

@Injectable()
export class WalletGateGuard implements CanActivate {
  constructor(private readonly prisma: D1PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-nexi-signature'];
    const publicKey = request.headers['x-nexi-public-key'];
    const message = request.headers['x-nexi-message'];

    if (!signature || !publicKey || !message) {
      throw new UnauthorizedException('NEXI SECURITY: Missing Ed25519 Handshake');
    }

    // THE VAULT: Ed25519 Message Signing Validation (2026 Sovereign Standard)
    try {
      const isVerified = verify(
        null,
        Buffer.from(message),
        {
          key: Buffer.from(publicKey, 'hex'),
          format: 'der',
          type: 'spki',
        },
        Buffer.from(signature, 'hex')
      );

      if (!isVerified) {
        throw new UnauthorizedException('NEXI SECURITY: Invalid Vault Signature');
      }

      // Bind the verified handshake to an existing wallet record via the user wallet relation
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: request.user?.id ?? '' },
        include: { user: true },
      });

      if (!wallet) {
        throw new UnauthorizedException('NEXI SECURITY: Unrecognized Sovereign Identity');
      }

      request.user = wallet.user; // Inject user into request
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new UnauthorizedException(`NEXI SECURITY: Vault Breach Attempt - ${message}`);
    }
  }
}
