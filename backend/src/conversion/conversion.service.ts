import { GoneException, Injectable } from '@nestjs/common';

@Injectable()
export class ConversionService {
  private legacyRouteDisabled(): never {
    throw new GoneException('Legacy conversion route disabled; use /financial/conversion/quote and /financial/conversion/accept');
  }

  async getRate(_from: string, _to: string): Promise<never> {
    return this.legacyRouteDisabled();
  }

  async convert(_userId: string, _fromCoin: string, _toCoin: string, _amount: string | number): Promise<never> {
    return this.legacyRouteDisabled();
  }

  async updateRate(_pair: string, _newRate: string | number): Promise<never> {
    return this.legacyRouteDisabled();
  }
}
