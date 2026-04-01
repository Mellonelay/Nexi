import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ConversionService } from './conversion.service';

@Controller('conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Get('rate')
  async getRate(@Query('from') from: string, @Query('to') to: string) {
    const rate = await this.conversionService.getRate(from, to);
    return { rate };
  }

  @Post('convert')
  async convert(@Body() body: { userId: string; from: string; to: string; amount: number }) {
    return this.conversionService.convert(body.userId, body.from, body.to, body.amount);
  }

  // Admin: Set Rate
  @Post('admin/rate')
  async setRate(@Body() body: { pair: string; rate: number }) {
    return this.conversionService.updateRate(body.pair, body.rate);
  }
}
