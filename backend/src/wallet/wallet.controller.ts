import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Will implement later

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('currencies/list')
  async getCurrencies() {
    return this.walletService.getSupportedCurrencies();
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getWallet(@Param('userId') userId: string) {
    return this.walletService.getAllBalances(userId);
  }
  
  // @UseGuards(JwtAuthGuard)
  @Get(':userId/ledger')
  async getLedger(@Param('userId') userId: string) {
    return this.walletService.getLedger(userId);
  }

  // Admin or Dev Testing Endpoints
  @Post('deposit')
  async deposit(@Body() body: { userId: string; currency: string; amount: number }) {
    return this.walletService.deposit(body.userId, body.currency, body.amount);
  }

  @Post('withdraw')
  async withdraw(@Body() body: { userId: string; currency: string; amount: number; address: string }) {
    return this.walletService.requestWithdrawal(body.userId, body.currency, body.amount, body.address);
  }

  // Admin Endpoints
  @Post('admin/credit')
  async adminCredit(@Body() body: { userId: string; currency: string; amount: number; reason: string }) {
    // In real app, add @UseGuards(AdminGuard)
    return this.walletService.deposit(body.userId, body.currency, body.amount, `ADMIN-CREDIT-${Date.now()}`);
  }

  @Post('admin/debit')
  async adminDebit(@Body() body: { userId: string; currency: string; amount: number; reason: string }) {
    // In real app, add @UseGuards(AdminGuard)
    // Reusing withdraw for debit, or we could implement specific debit logic
    return this.walletService.withdraw(body.userId, body.currency, body.amount, `ADMIN-DEBIT-${Date.now()}`);
  }

  @Get('admin/withdrawals')
  async getPendingWithdrawals() {
    return this.walletService.getPendingWithdrawals();
  }

  @Post('admin/withdrawals/approve')
  async approveWithdrawal(@Body() body: { requestId: string; txHash: string }) {
    return this.walletService.approveWithdrawal(body.requestId, body.txHash);
  }

  @Post('admin/withdrawals/reject')
  async rejectWithdrawal(@Body() body: { requestId: string; reason: string }) {
    return this.walletService.rejectWithdrawal(body.requestId, body.reason);
  }
}
