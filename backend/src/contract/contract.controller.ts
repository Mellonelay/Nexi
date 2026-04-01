import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ContractService } from './contract.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assuming Auth Guard exists

@Controller('lever')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post('deal')
  async deal(@Body() body: any) {
    // Frontend sends: { currency_id, share, direction, leverage, ... }
    // Or: { symbol, side, amount, leverage }
    // We map frontend fields to service args
    
    // Example mapping:
    // symbol: body.symbol || "BTC/USDT"
    // side: body.direction === 'BUY' ? 'BUY' : 'SELL'
    // amount: body.amount || body.share
    // leverage: body.leverNumber
    
    const side = body.direction === 'BUY' || body.type === 1 ? 'BUY' : 'SELL';
    
    return this.contractService.openPosition(
      body.userId || "test-user", // TODO: Extract from JWT
      body.symbol,
      side,
      Number(body.amount),
      Number(body.leverNumber)
    );
  }

  @Post('setstop')
  async setStop(@Body() body: any) {
    return this.contractService.setStop(
      body.userId || "test-user",
      body.id,
      Number(body.target_profit_price),
      Number(body.stop_loss_price)
    );
  }

  @Post('close')
  async close(@Body() body: any) {
    return this.contractService.closePosition(
      body.userId || "test-user",
      body.positionId || body.id
    );
  }

  @Get('my_trade')
  async myTrade(@Query() query: any) {
    return this.contractService.getMyTrades(
      query.userId || "test-user",
      query.status // 'history' or undefined
    );
  }
}
