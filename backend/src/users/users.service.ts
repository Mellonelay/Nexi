import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from '../auth/auth.dto';
import { randomInt } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

const PASSWORD_HASH_ROUNDS = 12;
const USER_CODE_MIN = 100000;
const USER_CODE_MAX = 1000000;
type UserWithKyc = Prisma.UserGetPayload<{ include: { kyc: { select: { status: true } } } }>;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  async findOne(email: string): Promise<UserWithKyc | null> {
    if (this.d1?.isEnabled()) {
      const user = await this.d1.getUserByEmail(email);
      if (!user) return null;
      return { ...user, kyc: user.kycStatus ? { status: user.kycStatus } : null } as unknown as UserWithKyc;
    }
    return this.prisma.user.findUnique({
      where: { email },
      include: { kyc: { select: { status: true } } },
    });
  }
  
  async findById(id: string): Promise<User | null> {
      if (this.d1?.isEnabled()) return (await this.d1.getUserById(id)) as unknown as User | null;
      return this.prisma.user.findUnique({
          where: { id }
      });
  }

  async createUser(data: SignupDto): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, PASSWORD_HASH_ROUNDS);

    if (this.d1?.isEnabled()) {
      const user = await this.d1.createPasswordUser({
        id: randomUUID(),
        userCode: randomInt(USER_CODE_MIN, USER_CODE_MAX),
        email: data.email,
        password: hashedPassword,
      });
      return user as unknown as User;
    }
    
    // Create user
    let user: User;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        user = await this.prisma.user.create({
          data: { email: data.email, password: hashedPassword, userCode: randomInt(USER_CODE_MIN, USER_CODE_MAX) },
        });
        break;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002' || attempt === 4) throw error;
      }
    }
    if (!user!) throw new Error('User creation failed');

    // Create wallet for the new user
    await this.walletService.createWallet(user.id);

    return user;
  }

  async createAdminUser(data: SignupDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, PASSWORD_HASH_ROUNDS);
    if (!this.d1?.isEnabled()) throw new Error('Staging Admin fixture requires D1 runtime');
    const user = await this.d1.createPasswordAdminUser({
      id: randomUUID(),
      userCode: randomInt(USER_CODE_MIN, USER_CODE_MAX),
      email: data.email,
      password: hashedPassword,
    });
    return user as unknown as User;
  }
}
