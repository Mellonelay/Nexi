import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lever')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post('deal')
  async deal(@Request() req: any, @Body() body: any) {
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
      req.user.userId,
      body.symbol,
      side,
      Number(body.amount),
      Number(body.leverNumber)
    );
  }

  @Post('setstop')
  async setStop(@Request() req: any, @Body() body: any) {
    return this.contractService.setStop(
      req.user.userId,
      body.id,
      Number(body.target_profit_price),
      Number(body.stop_loss_price)
    );
  }

  @Post('close')
  async close(@Request() req: any, @Body() body: any) {
    return this.contractService.closePosition(
      req.user.userId,
      body.positionId || body.id
    );
  }

  @Get('my_trade')
  async myTrade(@Request() req: any, @Query() query: any) {
    return this.contractService.getMyTrades(
      req.user.userId,
      query.status // 'history' or undefined
    );
  }
}
