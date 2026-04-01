import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { MiningService } from './mining.service';

@Controller('mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @Get('plans')
  async getPlans() {
    return this.miningService.getPlans();
  }

  @Post('subscribe')
  async subscribe(@Body() body: { userId: string; planId: string; amount: number }) {
    return this.miningService.subscribe(body.userId, body.planId, body.amount);
  }

  @Get('my/:userId')
  async getMySubs(@Param('userId') userId: string) {
    return this.miningService.getUserSubscriptions(userId);
  }

  // Admin: Create Plan
  @Post('admin/plan')
  async createPlan(@Body() body: { name: string; dailyYield: number; lockupPeriod: number; min: number; max: number }) {
    return this.miningService.createPlan(body.name, body.dailyYield, body.lockupPeriod, body.min, body.max);
  }
  
  // Dev: Force Yield Distribution
  @Post('admin/distribute')
  async forceDistribute() {
      await this.miningService.distributeRewards();
      return { message: 'Yield distribution triggered' };
  }
}
