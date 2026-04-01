import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { LoanService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loanService: LoanService) {}

  @Post('apply')
  async apply(@Body() body: { userId: string; amount: number; duration: number; collateralImg: string; collateral: string }) {
    return this.loanService.applyForLoan(body.userId, body.amount, body.duration, body.collateralImg, body.collateral);
  }

  @Get('my/:userId')
  async getMyLoans(@Param('userId') userId: string) {
    return this.loanService.getUserLoans(userId);
  }

  // Admin Endpoints
  @Get('admin/all')
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @Post('admin/approve')
  async approve(@Body() body: { loanId: string }) {
    return this.loanService.approveLoan(body.loanId);
  }

  @Post('admin/reject')
  async reject(@Body() body: { loanId: string }) {
    return this.loanService.rejectLoan(body.loanId);
  }
}
