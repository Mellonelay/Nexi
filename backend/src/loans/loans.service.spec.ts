import { Test, TestingModule } from '@nestjs/testing';
import { LoanService } from './loans.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoanStatus as PrismaLoanStatus } from '@prisma/client';

describe('LoanService', () => {
  let service: LoanService;
  let prismaService: any;
  let walletService: any;

  beforeEach(async () => {
    // Mock the dependencies
    const mockPrismaService = {
      loanApplication: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const mockWalletService = {
      deposit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoanService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    }).compile();

    service = module.get<LoanService>(LoanService);
    prismaService = module.get(PrismaService);
    walletService = module.get(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('applyForLoan', () => {
    it('should calculate handling fee and create a loan', async () => {
      const userId = 'user-1';
      const amount = 1000;
      const durationDays = 30;
      const collateralImg = 'img-url';
      const collateralDesc = 'BTC';

      const expectedHandlingFee = amount * 0.001;
      const expectedTotalRepayment = amount + expectedHandlingFee;

      const mockCreatedLoan = { id: 'loan-1', userId, amount, status: PrismaLoanStatus.PENDING };
      prismaService.loanApplication.create.mockResolvedValue(mockCreatedLoan);

      const result = await service.applyForLoan(userId, amount, durationDays, collateralImg, collateralDesc);

      expect(prismaService.loanApplication.create).toHaveBeenCalledWith({
        data: {
          userId,
          amount,
          currency: 'USDT',
          term: durationDays,
          durationDays,
          interestRate: 0,
          totalRepayment: expectedTotalRepayment,
          collateral: collateralDesc,
          collateralImg,
          status: PrismaLoanStatus.PENDING,
        },
      });
      expect(result).toEqual(mockCreatedLoan);
    });

    it('should throw BadRequestException if amount is <= 0', async () => {
      await expect(service.applyForLoan('user-1', 0, 30, 'img', 'desc')).rejects.toThrow(BadRequestException);
      await expect(service.applyForLoan('user-1', -100, 30, 'img', 'desc')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveLoan', () => {
    it('should credit user wallet and update loan status', async () => {
      const loanId = 'loan-1';
      const mockLoan = {
        id: loanId,
        userId: 'user-1',
        amount: 1000,
        currency: 'USDT',
        status: PrismaLoanStatus.PENDING,
        durationDays: 30,
      };

      prismaService.loanApplication.findUnique.mockResolvedValue(mockLoan);
      const mockUpdatedLoan = { ...mockLoan, status: PrismaLoanStatus.ACTIVE };
      prismaService.loanApplication.update.mockResolvedValue(mockUpdatedLoan);
      walletService.deposit.mockResolvedValue({});

      const result = await service.approveLoan(loanId);

      expect(prismaService.loanApplication.findUnique).toHaveBeenCalledWith({ where: { id: loanId } });
      expect(walletService.deposit).toHaveBeenCalledWith(mockLoan.userId, mockLoan.currency, mockLoan.amount, `LOAN-DISBURSE-${loanId}`);

      expect(prismaService.loanApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: loanId },
          data: expect.objectContaining({
            status: PrismaLoanStatus.ACTIVE,
          })
        })
      );
      // Let's verify that dueDate was calculated.
      const updateCall = prismaService.loanApplication.update.mock.calls[0][0];
      expect(updateCall.data.dueDate).toBeInstanceOf(Date);
      expect(updateCall.data.approvedAt).toBeInstanceOf(Date);

      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw NotFoundException if loan is not found', async () => {
      prismaService.loanApplication.findUnique.mockResolvedValue(null);
      await expect(service.approveLoan('loan-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if loan is not pending', async () => {
      const mockLoan = { id: 'loan-1', status: PrismaLoanStatus.ACTIVE };
      prismaService.loanApplication.findUnique.mockResolvedValue(mockLoan);
      await expect(service.approveLoan('loan-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectLoan', () => {
    it('should update loan status to REJECTED', async () => {
      const loanId = 'loan-1';
      const mockLoan = { id: loanId, status: PrismaLoanStatus.PENDING };
      const mockUpdatedLoan = { ...mockLoan, status: PrismaLoanStatus.REJECTED };

      prismaService.loanApplication.findUnique.mockResolvedValue(mockLoan);
      prismaService.loanApplication.update.mockResolvedValue(mockUpdatedLoan);

      const result = await service.rejectLoan(loanId);

      expect(prismaService.loanApplication.findUnique).toHaveBeenCalledWith({ where: { id: loanId } });
      expect(prismaService.loanApplication.update).toHaveBeenCalledWith({
        where: { id: loanId },
        data: { status: PrismaLoanStatus.REJECTED },
      });
      expect(result).toEqual(mockUpdatedLoan);
    });

    it('should throw NotFoundException if loan is not found', async () => {
      prismaService.loanApplication.findUnique.mockResolvedValue(null);
      await expect(service.rejectLoan('loan-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if loan is not pending', async () => {
      const mockLoan = { id: 'loan-1', status: PrismaLoanStatus.REJECTED };
      prismaService.loanApplication.findUnique.mockResolvedValue(mockLoan);
      await expect(service.rejectLoan('loan-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserLoans', () => {
    it('should return user loans', async () => {
      const userId = 'user-1';
      const mockLoans = [{ id: 'loan-1', userId }];
      prismaService.loanApplication.findMany.mockResolvedValue(mockLoans);

      const result = await service.getUserLoans(userId);

      expect(prismaService.loanApplication.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockLoans);
    });
  });

  describe('getAllLoans', () => {
    it('should return all loans with user email', async () => {
      const mockLoans = [{ id: 'loan-1', user: { email: 'test@test.com' } }];
      prismaService.loanApplication.findMany.mockResolvedValue(mockLoans);

      const result = await service.getAllLoans();

      expect(prismaService.loanApplication.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      });
      expect(result).toEqual(mockLoans);
    });
  });
});
