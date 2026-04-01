import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  // Proxy for external market data (e.g. Yahoo Finance)
  // Usage: /market/proxy?symbol=AAPL
  @Get('market/proxy')
  async getMarketData(@Query('symbol') symbol: string) {
      return this.appService.fetchMarketData(symbol);
  }

  // Bulk prices endpoint for frontend hook
  @Get('market/prices')
  async getAllPrices() {
      // Mock Binance Ticker Response format
      const symbols = [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 
        'ADAUSDT', 'DOGEUSDT', 'TRXUSDT', 'LTCUSDT', 'DOTUSDT',
        'AVAXUSDT', 'LINKUSDT', 'MATICUSDT', 'SHIBUSDT', 'BCHUSDT'
      ];
      
      const results = await Promise.all(symbols.map(async (s) => {
          const data = await this.appService.fetchMarketData(s);
          return {
              symbol: s.replace('/', ''),
              lastPrice: data.price.toString(),
              priceChangePercent: data.changePercent.toString(),
              volume: (Math.random() * 10000).toString()
          };
      }));
      
      return results;
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Dexi Trading Platform',
    };
  }
}
