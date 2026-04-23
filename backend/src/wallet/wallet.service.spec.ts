import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LedgerType } from '@prisma/client';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;

  const mockPrismaService = {
    wallet: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ledger: {
      create: jest.fn(),
    },
    currency: {
      findMany: jest.fn(),
    },
    withdrawalRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    it('should create a wallet for a new user', async () => {
      const userId = 'user123';
      const mockWallet = { id: 'wallet123', userId, balances: {} };
      (prisma.wallet.create as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.createWallet(userId);

      expect(prisma.wallet.create).toHaveBeenCalledWith({
        data: { userId, balances: {} },
      });
      expect(result).toEqual(mockWallet);
    });
  });

  describe('getBalance', () => {
    it('should return balance for a specific currency', async () => {
      const userId = 'user123';
      const currency = 'BTC';
      const balances = { BTC: { available: 1, locked: 0.5 } };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({ userId, balances });

      const result = await service.getBalance(userId, currency);

      expect(result).toEqual({ available: 1, locked: 0.5 });
    });

    it('should return zero balance if currency not found', async () => {
      const userId = 'user123';
      const currency = 'ETH';
      const balances = { BTC: { available: 1, locked: 0.5 } };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({ userId, balances });

      const result = await service.getBalance(userId, currency);

      expect(result).toEqual({ available: 0, locked: 0 });
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getBalance('user123', 'BTC')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllBalances', () => {
    it('should return all balances for a user', async () => {
      const userId = 'user123';
      const balances = { BTC: { available: 1, locked: 0.5 }, ETH: { available: 2, locked: 1 } };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({ userId, balances });

      const result = await service.getAllBalances(userId);

      expect(result).toEqual(balances);
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getAllBalances('user123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deposit', () => {
    it('should deposit funds successfully', async () => {
      const userId = 'user123';
      const currency = 'BTC';
      const amount = 1;
      const mockWallet = { id: 'wallet123', userId, balances: {} };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.deposit(userId, currency, amount);

      expect(prisma.wallet.update).toHaveBeenCalled();
      expect(prisma.ledger.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          walletId: 'wallet123',
          currency,
          amount,
          type: LedgerType.DEPOSIT,
        }),
      }));
      expect(result).toEqual({ available: 1, locked: 0 });
    });

    it('should throw BadRequestException for non-positive amount', async () => {
      await expect(service.deposit('user123', 'BTC', 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.deposit('user123', 'BTC', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('withdraw', () => {
    it('should withdraw funds successfully', async () => {
      const userId = 'user123';
      const currency = 'BTC';
      const amount = 0.5;
      const balances = { BTC: { available: 1, locked: 0 } };
      const mockWallet = { id: 'wallet123', userId, balances };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await service.withdraw(userId, currency, amount);

      expect(prisma.wallet.update).toHaveBeenCalled();
      expect(prisma.ledger.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          walletId: 'wallet123',
          currency,
          amount: -amount,
          type: LedgerType.WITHDRAWAL,
        }),
      }));
      expect(result).toEqual({ available: 0.5, locked: 0 });
    });

    it('should throw BadRequestException if insufficient funds', async () => {
      const userId = 'user123';
      const currency = 'BTC';
      const balances = { BTC: { available: 0.1, locked: 0 } };
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({ id: 'wallet123', userId, balances });

      await expect(service.withdraw(userId, currency, 0.5)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-positive amount', async () => {
      await expect(service.withdraw('user123', 'BTC', -1)).rejects.toThrow(BadRequestException);
    });
  });
});
