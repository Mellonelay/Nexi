import { Controller, Post, Body, Get, Param, UseGuards, Query } from '@nestjs/common';
import { BinaryService } from './binary.service';
import { BinarySide } from '@prisma/client';

@Controller('microtrade')
export class BinaryController {
  constructor(private readonly binaryService: BinaryService) {}

  // Matches /microtrade/seconds_order
  @Post('seconds_order')
  async openPosition(@Body() body: any) {
    // Map Frontend Payload
    // match_id -> symbol (Need a lookup or just assume match_id is passed as ID, but service expects symbol)
    // For now, let's assume body.symbol is passed or we look it up.
    // Frontend sends: match_id, currency_id, type (1=Call?), seconds, number (amount)
    
    const side = body.type === 1 ? BinarySide.CALL : BinarySide.PUT;
    
    // We need to fetch symbol from match_id if not provided.
    // For MVP, assuming match_id maps to symbol in DB or body has symbol.
    // Let's assume body.symbol exists or default to BTC/USDT if match_id=1.
    const symbol = body.symbol || "BTC/USDT"; 

    return this.binaryService.openPosition(
      body.userId || "test-user", // TODO: Auth
      symbol,
      Number(body.number), // Amount
      side,
      Number(body.seconds)
    );
  }

  // Matches /microtrade/listsV2
  @Get('listsV2')
  async getConfig() {
    return this.binaryService.getConfig();
  }

  // Legacy or Admin
  @Post('admin/force-result')
  async forceResult(@Body() body: { positionId: string; outcome: 'WIN' | 'LOSE' }) {
    return this.binaryService.adminForceResult(body.positionId, body.outcome);
  }
}
