import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Dexi Trading Platform API is running!';
  }

  async fetchMarketData(symbol: string) {
      // Mock Real Data for now (or integrate Yahoo Finance API)
      // Yahoo Finance is hard without library.
      // Let's generate "Realistic Live Data" based on a base price that moves randomly but consistently.
      // In a real production app, we would use AlphaVantage or IEX Cloud.
      
      const basePriceMap: Record<string, number> = {
          'AAPL': 180.00, 'TSLA': 240.00, 'GOOGL': 140.00, 'AMZN': 175.00, 'MSFT': 420.00,
          'NVDA': 950.00, 'META': 500.00, 'NFLX': 600.00,
          'XAU/USD': 2160.00, 'XAG/USD': 25.00, 'XPT/USD': 920.00, 'XPD/USD': 1050.00,
          'EUR/USD': 1.09, 'GBP/USD': 1.27, 'USD/JPY': 150.00, 'AUD/USD': 0.65,
          'USD/CAD': 1.35, 'USD/CHF': 0.88, 'NZD/USD': 0.61,
          'BTC': 89800.0, 'ETH': 3200.0, 'BNB': 650.0, 'SOL': 180.0, 'XRP': 1.10,
          'ADA': 0.85, 'DOGE': 0.35, 'TRX': 0.22, 'LTC': 150.0, 'DOT': 7.0, 'AVAX': 35.0,
          'LINK': 15.0, 'MATIC': 0.7, 'SHIB': 0.00002, 'BCH': 400.0,
          'BNBUSDT': 650.0, 'SOLUSDT': 180.0, // Add variants for robustness
          'AVAXUSDT': 35.0, 'LINKUSDT': 15.0, 'MATICUSDT': 0.7, 'SHIBUSDT': 0.00002, 'BCHUSDT': 400.0,
          'TRXUSDT': 0.22, 'LTCUSDT': 150.0, 'DOTUSDT': 7.0, 'DOGEUSDT': 0.35, 'ADAUSDT': 0.85,
          'XRPUSDT': 1.10, 'ETHUSDT': 3200.0, 'BTCUSDT': 89800.0
      };

      // Normalize symbol: Frontend sends "AAPL/USDT" -> "AAPL"
      // Or "AAPL" -> "AAPL"
      // Or "BNBUSDT" -> "BNBUSDT" (if split fails to find slash)
      let normalizedSymbol = symbol.split('/')[0];
      
      // Handle Binance format edge case (BNBUSDT -> BNB)
      if (normalizedSymbol.endsWith('USDT') && normalizedSymbol.length > 4) {
          // Check if we have a direct match first
          if (!basePriceMap[normalizedSymbol]) {
               const raw = normalizedSymbol.replace('USDT', '');
               if (basePriceMap[raw]) normalizedSymbol = raw;
          }
      }
      
      let price = basePriceMap[normalizedSymbol] || 100.00;
      
      // Add random fluctuation (+- 0.5%)
      const change = (Math.random() * 0.01) - 0.005; 
      price = price * (1 + change);

      return {
          symbol,
          price,
          changePercent: change * 100
      };
  }
}
