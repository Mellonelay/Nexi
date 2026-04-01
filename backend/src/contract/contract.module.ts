import { Module } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BinaryGateway } from '../binary/binary.gateway'; // Reuse gateway or create new? Reuse for now.

@Module({
  controllers: [ContractController],
  providers: [ContractService, PrismaService, WalletService],
})
export class ContractModule {}
