import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoanStatus, LedgerType } from '@prisma/client';

@Injectable()
export class LoanService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  // Apply for a loan
  async applyForLoan(userId: string, amount: number, durationDays: number, collateralImg: string, collateralDesc: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Logic from screenshot:
    // Daily Interest: 0%
    // Handling Fee: 0.1%
    const interestRate = 0; 
    const handlingFeeRate = 0.001;
    const handlingFee = amount * handlingFeeRate;
    
    // Total Repayment = Principal + Interest (0) + Fee? 
    // Usually fee is deducted or added. Let's add it to repayment for simplicity or store it.
    // The screenshot shows "Interest 0", "Handling fee 0 USDT" (likely calculated).
    
    const totalRepayment = amount + handlingFee;

    return this.prisma.loanApplication.create({
      data: {
        userId,
        amount,
        currency: 'USDT',
        term: durationDays,
        durationDays,
        interestRate,
        totalRepayment,
        collateral: collateralDesc, // Will store image URLs here or description
        collateralImg,
        status: LoanStatus.PENDING,
      },
    });
  }

  // Admin: Approve Loan
  async approveLoan(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not pending');

    // 1. Credit User Wallet with Loan Amount
    await this.walletService.deposit(loan.userId, loan.currency, loan.amount, `LOAN-DISBURSE-${loan.id}`);

    // 2. Update Loan Status
    return this.prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.ACTIVE,
        approvedAt: new Date(),
        dueDate: new Date(Date.now() + loan.durationDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Admin: Reject Loan
  async rejectLoan(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.PENDING) throw new BadRequestException('Loan is not pending');

    return this.prisma.loanApplication.update({
      where: { id: loanId },
      data: { status: LoanStatus.REJECTED },
    });
  }

  // Get User Loans
  async getUserLoans(userId: string) {
    return this.prisma.loanApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get All Loans (Admin)
  async getAllLoans() {
    return this.prisma.loanApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } }
    });
  }
}
