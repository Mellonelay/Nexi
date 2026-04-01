import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService
  ) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  
  async findById(id: string): Promise<User | null> {
      return this.prisma.user.findUnique({
          where: { id }
      });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    // Create wallet for the new user
    await this.walletService.createWallet(user.id);

    return user;
  }
}
