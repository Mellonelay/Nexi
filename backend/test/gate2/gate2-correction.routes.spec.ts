import { GoneException } from '@nestjs/common';
import { Gate2SpotOrderType, OrderSide } from '@prisma/client';
import { ConversionController } from '../../src/conversion/conversion.controller';
import { ConversionService } from '../../src/conversion/conversion.service';
import { SpotController } from '../../src/spot/spot.controller';
import { WalletController } from '../../src/wallet/wallet.controller';

describe('Gate 2 correction route boundaries', () => {
  it('forwards the complete Spot command without deriving idempotency', async () => {
    const spotService = { placeOrder: jest.fn().mockResolvedValue({ id: 'order-1' }) };
    const controller = new SpotController(spotService as never);
    await controller.placeOrder({
      pair: 'BTC/USDT', side: OrderSide.BUY, type: Gate2SpotOrderType.STOP,
      amount: '1', price: '99', stopPrice: '100', idempotencyKey: 'caller-key-1',
    }, { user: { userId: 'user-1' } } as never);
    expect(spotService.placeOrder).toHaveBeenCalledWith('user-1', {
      pair: 'BTC/USDT', side: OrderSide.BUY, type: Gate2SpotOrderType.STOP,
      amount: '1', price: '99', stopPrice: '100', idempotencyKey: 'caller-key-1',
    });
  });

  it('disables every legacy conversion mutation/read authority', async () => {
    const service = new ConversionService();
    await expect(service.getRate('BTC', 'USDT')).rejects.toBeInstanceOf(GoneException);
    await expect(service.convert('user-1', 'BTC', 'USDT', '1')).rejects.toBeInstanceOf(GoneException);
    await expect(service.updateRate('BTC:USDT', '1')).rejects.toBeInstanceOf(GoneException);

    const controller = new ConversionController(service);
    await expect(controller.convert({ from: 'BTC', to: 'USDT', amount: '1' } as never, { user: { userId: 'user-1' } } as never)).rejects.toBeInstanceOf(GoneException);
    await expect(controller.setRate({ pair: 'BTC:USDT', rate: '1' } as never)).rejects.toBeInstanceOf(GoneException);
  });

  it('disables legacy wallet balance, withdrawal, review, and txHash mutation routes', async () => {
    const walletService = {
      deposit: jest.fn(), withdraw: jest.fn(), requestWithdrawal: jest.fn(),
      getPendingWithdrawals: jest.fn(), approveWithdrawal: jest.fn(), rejectWithdrawal: jest.fn(),
    };
    const controller = new WalletController(walletService as never);
    await expect(controller.deposit({} as never)).rejects.toBeInstanceOf(GoneException);
    await expect(controller.withdraw({} as never)).rejects.toBeInstanceOf(GoneException);
    await expect(controller.adminCredit({} as never)).rejects.toBeInstanceOf(GoneException);
    await expect(controller.adminDebit({} as never)).rejects.toBeInstanceOf(GoneException);
    await expect(controller.getPendingWithdrawals()).rejects.toBeInstanceOf(GoneException);
    await expect(controller.approveWithdrawal({} as never)).rejects.toBeInstanceOf(GoneException);
    await expect(controller.rejectWithdrawal({} as never)).rejects.toBeInstanceOf(GoneException);
    expect(walletService.deposit).not.toHaveBeenCalled();
    expect(walletService.withdraw).not.toHaveBeenCalled();
    expect(walletService.approveWithdrawal).not.toHaveBeenCalled();
  });
});
