import { Body, Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // --- Dashboard ---
  @Get('stats')
  getStats() {
    return this.adminService.getAdminStats();
  }

  @Get('system-config')
  getSystemConfig() {
    return this.adminService.getSystemConfig();
  }

  @Post('system-config')
  updateSystemConfig(@Body() body: { key: string; value: string; description?: string }) {
    return this.adminService.updateSystemConfig(body.key, body.value, body.description);
  }

  // --- Users ---
  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('user/control')
  updateUserControl(@Body() body: { userId: string, outcome: string }) {
    return this.adminService.setWinRate(body.userId, body.outcome);
  }

  // --- Crypto / Currency ---
  @Get('currencies')
  getCurrencies() {
    return this.adminService.getCurrencies();
  }

  @Post('currencies')
  createCurrency(@Body() body: any) {
    return this.adminService.createCurrency(body);
  }

  @Patch('currencies/:id')
  updateCurrency(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCurrency(Number(id), body);
  }

  @Post('currencies/:id/address')
  addDepositAddress(@Param('id') id: string, @Body() body: { network: string, address: string, label?: string }) {
    return this.adminService.addDepositAddress(Number(id), body.network, body.address, body.label);
  }

  @Delete('address/:id')
  deleteDepositAddress(@Param('id') id: string) {
    return this.adminService.deleteDepositAddress(id);
  }

  // --- Mining Plans ---
  @Get('mining-plans')
  getMiningPlans() {
    return this.adminService.getMiningPlans();
  }

  @Post('mining-plans')
  createMiningPlan(@Body() body: any) {
    return this.adminService.createMiningPlan(body);
  }

  @Patch('mining-plans/:id')
  updateMiningPlan(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateMiningPlan(id, body);
  }

  // --- Loan Plans ---
  @Get('loan-plans')
  getLoanPlans() {
    return this.adminService.getLoanPlans();
  }

  @Post('loan-plans')
  createLoanPlan(@Body() body: any) {
    return this.adminService.createLoanPlan(body);
  }

  @Patch('loan-plans/:id')
  updateLoanPlan(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateLoanPlan(id, body);
  }

  // --- Risk Management ---
  @Get('risk/pairs')
  getBinaryPairs() {
    return this.adminService.getBinaryPairs();
  }

  @Post('risk/update')
  updatePairRisk(@Body() body: { symbol: string, houseWinRatio: number }) {
    return this.adminService.updatePairRisk(body.symbol, body.houseWinRatio);
  }

  // --- Sync / Utils ---
  @Post('sync-markets')
  syncMarkets() {
    return this.adminService.syncMarkets();
  }

  @Post('sync-real')
  syncReal() {
    return this.adminService.syncReal();
  }

  @Post('payout')
  updatePayout(@Body() body: { rate: number }) {
    return this.adminService.updateGlobalPayout(body.rate);
  }
}
