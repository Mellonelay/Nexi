import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Dexi Trading Platform API is running!';
  }

  async fetchMarketData(_symbol: string): Promise<never> {
    throw new ServiceUnavailableException('Market data unavailable');
  }
}
