import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import { AdminService } from "./admin.service";
import { AdminWalletConfigurationService } from "./admin-wallet-configuration.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import {
  CreateCurrencyDto,
  CreateDepositAddressDto,
  CreateWalletNetworkDto,
  UpdateWalletNetworkDto,
  UpdateDepositAddressStateDto,
  CreateLoanPlanDto,
  CreateMiningPlanDto,
  UpdateCurrencyDto,
  UpdateLoanPlanDto,
  UpdateMiningPlanDto,
  UpdateBinaryConfigurationDto,
  UpdateMarginConfigurationDto,
  UpdateSystemConfigDto,
  CreateGovernanceCommandDto,
  GovernanceDecisionDto,
  UpdateFeatureFlagDto,
  FinancialCorrectionDto,
  SandboxControlDto,
  BinaryResearchDefaultDto,
  BinaryResearchPositionDto,
  AdminAuditQueryDto,
  AdminIncidentQueryDto,
  AdminIncidentAcknowledgeDto,
  AdminSendMessageDto,
  AdminPairMaintenanceDto,
  AdminKycDecisionDto,
  AdminFeedStatusDto,
  AdminAssetVisibilityDto,
  AdminNetworkVisibilityDto,
  CreateMaintenanceWindowDto,
  MaintenanceWindowQueryDto,
  CancelMaintenanceWindowDto,
} from "./admin.dto";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AdminPermissionGuard } from "./admin-permission.guard";
import { RequireAdminPermission } from "./admin-permission.decorator";
import { MiningService } from "../mining/mining.service";
import { LoanService } from "../loans/loans.service";
import { LoanAdminDecisionDto } from "../loans/loans.dto";
import { MarketProviderRouterService } from "../market/market-provider-router.service";
import { KycService } from "../kyc/kyc.service";
import { CommunicationsService } from "../communications/communications.service";
import { SUPPORT_ATTACHMENT_MAX_BYTES, type SupportUpload } from "../communications/support-attachment-storage.service";
import { AdminMessageResponseDto, SupportAttachmentResponseDto } from "../communications/communications.dto";
import { AuthRateLimit } from "../auth/auth-rate-limit.decorator";
import { AuthRateLimitGuard } from "../auth/auth-rate-limit.guard";

@ApiTags("Admin Control Plane")
@ApiBearerAuth()
@Controller("admin")
@UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
@RequireAuthSurface("ADMIN")
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly walletConfiguration: AdminWalletConfigurationService,
    private readonly miningService: MiningService,
    private readonly loanService: LoanService,
    private readonly marketProviders: MarketProviderRouterService,
    private readonly kycService: KycService,
    private readonly communications: CommunicationsService,
  ) {}

  @Get("me")
  getAdminIdentity(@Req() request: AuthenticatedRequest) {
    return this.adminService.getAdminIdentity(request.user);
  }

  @Post("messages")
  @ApiCreatedResponse({ type: AdminMessageResponseDto, description: "The persisted operator message and its audit reference." })
  @RequireAdminPermission("messages.send")
  sendAdminMessage(
    @Body() body: AdminSendMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.communications.sendAdminMessage(request.user.userId, body);
  }

  @Post("messages/:recipientId/attachments")
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } })
  @ApiCreatedResponse({ type: SupportAttachmentResponseDto })
  @RequireAdminPermission("messages.send")
  @UseGuards(AuthRateLimitGuard)
  @AuthRateLimit("message-attachment")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: SUPPORT_ATTACHMENT_MAX_BYTES, files: 1 } }))
  uploadAdminSupportAttachment(
    @Param("recipientId", ParseUUIDPipe) recipientId: string,
    @UploadedFile() file?: SupportUpload,
  ) {
    return this.communications.uploadAdminSupportAttachment(recipientId, file);
  }

  @Get("messages/:recipientId/attachments/:id")
  @ApiProduces("image/png", "image/jpeg", "image/webp", "application/pdf")
  @ApiOkResponse({ schema: { type: "string", format: "binary" }, description: "Private attachment for the specified customer's support conversation." })
  @RequireAdminPermission("messages.view")
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cache-Control", "private, no-store")
  async getAdminSupportAttachment(
    @Param("recipientId", ParseUUIDPipe) recipientId: string,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const { attachment, body } = await this.communications.getAdminSupportAttachment(recipientId, id);
    return new StreamableFile(body, {
      type: attachment.mimeType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      length: attachment.size,
    });
  }

  @Get("roles")
  @RequireAdminPermission("roles.view")
  listAdminRoleDefinitions() {
    return this.adminService.listAdminRoleDefinitions();
  }

  @Get("admins")
  @RequireAdminPermission("admins.view")
  listAdminAccounts() {
    return this.adminService.listAdminAccounts();
  }

  @Get("admins/:id")
  @RequireAdminPermission("admins.view")
  getAdminAccount(@Param("id", ParseUUIDPipe) id: string) {
    return this.adminService.getAdminAccount(id);
  }

  @Get("audit")
  @RequireAdminPermission("audit.view")
  listAdminAudit(@Query() query: AdminAuditQueryDto) {
    return this.adminService.listAdminAudit(query);
  }

  @Get("incidents")
  @RequireAdminPermission("health.view")
  listIncidents(@Query() query: AdminIncidentQueryDto) {
    return this.adminService.listIncidents(query);
  }

  @Post("incidents/:id/acknowledge")
  @ApiOperation({ summary: "Acknowledge an operational incident" })
  @ApiResponse({
    status: 200,
    description: "Incident acknowledgement result",
    schema: { type: "object", additionalProperties: true },
  })
  @ApiBadRequestResponse({ description: "Invalid acknowledgement request" })
  @ApiNotFoundResponse({ description: "Incident not found" })
  @RequireAdminPermission("health.acknowledge")
  acknowledgeIncident(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.acknowledgeIncident(id, request.user.userId, body);
  }

  @Get("maintenance-windows")
  @RequireAdminPermission("maintenance.view")
  listMaintenanceWindows(@Query() query: MaintenanceWindowQueryDto) {
    return this.adminService.listMaintenanceWindows(query);
  }

  @Post("maintenance-windows")
  @ApiOperation({ summary: "Schedule a maintenance window" })
  @ApiResponse({
    status: 200,
    description: "Maintenance window result",
    schema: { type: "object", additionalProperties: true },
  })
  @ApiBadRequestResponse({ description: "Invalid maintenance window request" })
  @RequireAdminPermission("maintenance.edit")
  createMaintenanceWindow(
    @Body() body: CreateMaintenanceWindowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.createMaintenanceWindow({
      ...body,
      createdBy: request.user.userId,
    });
  }

  @Post("maintenance-windows/:id/cancel")
  @ApiOperation({ summary: "Cancel a maintenance window" })
  @ApiResponse({
    status: 200,
    description: "Maintenance cancellation result",
    schema: { type: "object", additionalProperties: true },
  })
  @ApiBadRequestResponse({
    description: "Invalid maintenance cancellation request",
  })
  @ApiNotFoundResponse({ description: "Maintenance window not found" })
  @RequireAdminPermission("maintenance.edit")
  cancelMaintenanceWindow(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CancelMaintenanceWindowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.cancelMaintenanceWindow(
      id,
      request.user.userId,
      body,
    );
  }

  // --- Dashboard ---
  @Get("stats")
  @RequireAdminPermission("overview.view")
  getStats() {
    return this.adminService.getAdminStats();
  }

  @Get("system-config")
  @RequireAdminPermission("flags.view")
  getSystemConfig() {
    return this.adminService.getSystemConfig();
  }

  @Post("system-config")
  @RequireAdminPermission("flags.edit")
  updateSystemConfig(
    @Body() body: UpdateSystemConfigDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.updateSystemConfig(
      body.key,
      body.value,
      body.description,
      body.reason,
      request.user.userId,
    );
  }

  @Get("governance/commands")
  @RequireAdminPermission("approvals.view")
  listGovernanceCommands() {
    return this.adminService.listGovernanceCommands();
  }

  @Post("governance/commands")
  @RequireAdminPermission("approvals.view")
  createGovernanceCommand(
    @Body() body: CreateGovernanceCommandDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.createGovernanceCommand({
      ...body,
      requestedBy: request.user.userId,
    });
  }

  @Post("governance/commands/:id/approve")
  @RequireAdminPermission("approvals.decide")
  approveGovernanceCommand(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: GovernanceDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.decideGovernanceCommand(
      id,
      request.user.userId,
      "APPROVED",
      body.reason,
    );
  }

  @Post("governance/commands/:id/reject")
  @RequireAdminPermission("approvals.decide")
  rejectGovernanceCommand(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: GovernanceDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.decideGovernanceCommand(
      id,
      request.user.userId,
      "REJECTED",
      body.reason,
    );
  }

  @Get("feature-flags")
  @RequireAdminPermission("flags.view")
  listFeatureFlags() {
    return this.adminService.listFeatureFlags();
  }

  @Post("feature-flags")
  @RequireAdminPermission("flags.edit")
  updateFeatureFlag(
    @Body() body: UpdateFeatureFlagDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.updateFeatureFlag({
      ...body,
      updatedBy: request.user.userId,
    });
  }

  @Post("financial-corrections")
  @RequireAdminPermission("approvals.decide")
  applyFinancialCorrection(
    @Body() body: FinancialCorrectionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.applyFinancialCorrection({
      ...body,
      adminId: request.user.userId,
    });
  }

  @Post("sandbox/controls")
  @RequireAdminPermission("sandbox.force")
  requestSandboxControl(
    @Body() body: SandboxControlDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.requestSandboxControl({
      ...body,
      requestedBy: request.user.userId,
    });
  }

  @Post("sandbox/controls/:id/execute")
  @RequireAdminPermission("sandbox.force")
  executeSandboxControl(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.executeSandboxControl(id, request.user.userId);
  }

  // --- Users ---
  @Get("users")
  @RequireAdminPermission("users.view")
  getUsers() {
    return this.adminService.getUsers();
  }

  @Patch("users/:id/binary-research-default")
  @RequireAdminPermission("binary.edit")
  setBinaryResearchDefault(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: BinaryResearchDefaultDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setBinaryResearchDefault({
      userId: id,
      mode: body.mode,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
      adminId: request.user.userId,
    });
  }

  @Patch("binary/positions/:id/research-control")
  @RequireAdminPermission("binary.edit")
  setBinaryResearchPositionOverride(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: BinaryResearchPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setBinaryResearchPositionOverride({
      positionId: id,
      mode: body.mode,
      expectedVersion: body.expectedVersion,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
      adminId: request.user.userId,
    });
  }

  @Get("kyc")
  @RequireAdminPermission("kyc.view")
  getKycReviews() {
    return this.adminService.getKycReviews();
  }

  @Get("kyc/:userId/evidence/:side")
  @RequireAdminPermission("kyc.view")
  @Header("Cache-Control", "private, no-store")
  @Header("X-Content-Type-Options", "nosniff")
  async getKycEvidence(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Param("side") side: string,
  ) {
    if (side !== "front" && side !== "back") {
      throw new BadRequestException("Evidence side must be front or back");
    }
    const evidence = await this.kycService.getAdminEvidence(userId, side);
    return new StreamableFile(evidence.body, {
      type: evidence.contentType,
      disposition: 'attachment; filename="kyc-evidence"',
    });
  }

  @Post("kyc/decision")
  @RequireAdminPermission("kyc.decide")
  decideKyc(
    @Body() body: AdminKycDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.decideKyc({
      ...body,
      adminId: request.user.userId,
    });
  }

  @Get("sessions")
  @RequireAdminPermission("sessions.view")
  getAuthSessions() {
    return this.adminService.getAuthSessions();
  }

  @Post("sessions/:id/revoke")
  @RequireAdminPermission("sessions.revoke")
  revokeAuthSession(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.revokeAuthSession(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("users/:id/sessions/revoke")
  @RequireAdminPermission("sessions.revoke")
  revokeUserSessions(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.revokeUserSessions(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  // --- Crypto / Currency ---
  @Get("currencies")
  @RequireAdminPermission("assets.view")
  getCurrencies() {
    return this.adminService.getCurrencies();
  }

  @Get("market/assets")
  @RequireAdminPermission("assets.view")
  getMarketAssets() {
    return this.adminService.getMarketAssets();
  }

  @Post("market/assets/visibility")
  @RequireAdminPermission("assets.edit")
  setMarketAssetVisibility(
    @Body() body: AdminAssetVisibilityDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setMarketAssetVisibility({
      ...body,
      adminId: request.user.userId,
    });
  }

  @Get("market/networks")
  @RequireAdminPermission("networks.view")
  getMarketNetworks() {
    return this.adminService.getMarketNetworks();
  }

  @Post("market/networks/visibility")
  @RequireAdminPermission("networks.edit")
  setMarketNetworkVisibility(
    @Body() body: AdminNetworkVisibilityDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setMarketNetworkVisibility({
      ...body,
      adminId: request.user.userId,
    });
  }

  @Get("market/feeds")
  @RequireAdminPermission("feeds.view")
  getMarketFeeds() {
    return this.adminService.getMarketFeeds();
  }

  @Get("market/runtime")
  @RequireAdminPermission("feeds.view")
  getMarketRuntime() {
    return this.marketProviders.currentStatus();
  }

  @Post("market/feeds/status")
  @RequireAdminPermission("feeds.edit")
  setMarketFeedStatus(
    @Body() body: AdminFeedStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setMarketFeedStatus({
      ...body,
      adminId: request.user.userId,
    });
  }

  @Get("spot/pairs")
  @RequireAdminPermission("spot.view")
  getSpotPairs() {
    return this.adminService.getSpotPairs();
  }

  @Get("spot/orders")
  @RequireAdminPermission("spot.view")
  getSpotOrders() {
    return this.adminService.getSpotOrders();
  }

  @Get("spot/margin/config")
  @RequireAdminPermission("spot.view")
  getMarginConfiguration() {
    return this.adminService.getMarginConfiguration();
  }

  @Post("spot/margin/config")
  @RequireAdminPermission("spot.edit")
  updateMarginConfiguration(
    @Body() body: UpdateMarginConfigurationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.updateMarginConfiguration(body, request.user.userId);
  }

  @Post("spot/orders/:id/cancel")
  @RequireAdminPermission("spot.cancel_order")
  cancelAdminSpotOrder(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.cancelAdminSpotOrder(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("spot/pairs/maintenance")
  @RequireAdminPermission("spot.pause")
  setSpotPairMaintenance(
    @Body() body: AdminPairMaintenanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setSpotPairMaintenance(
      body.symbol,
      body.enabled,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Get("binary/positions")
  @RequireAdminPermission("binary.view")
  getBinaryPositions() {
    return this.adminService.getBinaryPositions();
  }

  @Get("binary/settlements")
  @RequireAdminPermission("settlements.view")
  getBinarySettlements() {
    return this.adminService.getAdminSettlements();
  }

  @Post("binary/positions/:id/settle")
  @RequireAdminPermission("binary.settle")
  settleBinaryPosition(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.settleAdminBinaryPosition(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("binary/pairs/maintenance")
  @RequireAdminPermission("binary.edit")
  setBinaryPairMaintenance(
    @Body() body: AdminPairMaintenanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.setBinaryPairMaintenance(
      body.symbol,
      body.enabled,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Get("wallets")
  @RequireAdminPermission("wallets.view")
  getAdminWallets() {
    return this.adminService.getAdminWallets();
  }

  @Get("ledger")
  @RequireAdminPermission("ledger.view")
  getAdminLedger() {
    return this.adminService.getAdminLedger();
  }

  @Get("deposits")
  @RequireAdminPermission("deposits.view")
  getAdminDeposits() {
    return this.adminService.getAdminDeposits();
  }

  @Get("deposit-claims")
  @RequireAdminPermission("deposits.view")
  getAdminDepositClaims() {
    return this.adminService.getAdminDepositClaims();
  }

  @Post("deposit-claims/:id/confirm")
  @RequireAdminPermission("deposits.confirm")
  confirmDepositClaim(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.confirmDepositClaim(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("deposit-claims/:id/credit")
  @RequireAdminPermission("deposits.confirm")
  creditDepositClaim(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.creditDepositClaim(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("deposit-claims/:id/reject")
  @RequireAdminPermission("deposits.confirm")
  rejectDepositClaim(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.rejectDepositClaim(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("deposits/:id/confirm")
  @RequireAdminPermission("deposits.confirm")
  confirmAdminDeposit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.confirmAdminDeposit(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("deposits/:id/credit")
  @RequireAdminPermission("deposits.confirm")
  creditAdminDeposit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.creditAdminDeposit(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("deposits/:id/fail")
  @RequireAdminPermission("deposits.confirm")
  failAdminDeposit(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.failAdminDeposit(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Get("withdrawals")
  @RequireAdminPermission("withdrawals.view")
  getAdminWithdrawals() {
    return this.adminService.getAdminWithdrawals();
  }

  @Post("withdrawals/:id/approve")
  @RequireAdminPermission("withdrawals.approve")
  approveAdminWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.decideAdminWithdrawal(
      id,
      "approved",
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("withdrawals/:id/reject")
  @RequireAdminPermission("withdrawals.approve")
  rejectAdminWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.decideAdminWithdrawal(
      id,
      "rejected",
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("withdrawals/:id/review")
  @RequireAdminPermission("withdrawals.approve")
  requestAdminWithdrawalReview(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.requestAdminWithdrawalReview(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("withdrawals/:id/review/return")
  @RequireAdminPermission("withdrawals.approve")
  returnAdminWithdrawalFromReview(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.returnAdminWithdrawalFromReview(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("withdrawals/:id/fail")
  @RequireAdminPermission("withdrawals.approve")
  failAdminWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.failAdminWithdrawal(
      id,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Get("announcements")
  @RequireAdminPermission("announcements.view")
  getAdminAnnouncements() {
    return this.adminService.getAdminAnnouncements();
  }

  @Post("currencies")
  @RequireAdminPermission("assets.edit")
  createCurrency(@Body() body: CreateCurrencyDto, @Req() request: AuthenticatedRequest) {
    return this.walletConfiguration.createCurrency(body, request.user.userId);
  }

  @Patch("currencies/:id")
  @RequireAdminPermission("assets.edit")
  updateCurrency(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateCurrencyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.updateCurrency(id, body, request.user.userId);
  }

  @Post("currencies/:id/address")
  @RequireAdminPermission("assets.edit")
  addDepositAddress(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: CreateDepositAddressDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.addDepositAddress(
      id,
      body.network,
      body.address,
      body.label,
      request.user.userId,
      body.reason,
      body.idempotencyKey,
    );
  }

  @Post("address/:id/disable")
  @RequireAdminPermission("assets.edit")
  deleteDepositAddress(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminIncidentAcknowledgeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.deleteDepositAddress(id, request.user.userId, body.reason, body.idempotencyKey);
  }

  @Get("wallet-networks")
  @RequireAdminPermission("assets.view")
  getWalletNetworks() { return this.walletConfiguration.getWalletNetworks(); }

  @Post("wallet-networks")
  @RequireAdminPermission("assets.edit")
  createWalletNetwork(@Body() body: CreateWalletNetworkDto, @Req() request: AuthenticatedRequest) {
    return this.walletConfiguration.createWalletNetwork(body, request.user.userId);
  }

  @Patch("wallet-networks/:id")
  @RequireAdminPermission("assets.edit")
  updateWalletNetwork(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateWalletNetworkDto, @Req() request: AuthenticatedRequest) {
    return this.walletConfiguration.updateWalletNetwork(id, body, request.user.userId);
  }

  @Patch("address/:id/state")
  @RequireAdminPermission("assets.edit")
  updateDepositAddressState(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateDepositAddressStateDto, @Req() request: AuthenticatedRequest) {
    return this.walletConfiguration.setDepositAddressState(id, body, request.user.userId);
  }

  // --- Mining Plans ---
  @Get("mining-plans")
  @RequireAdminPermission("mining.view")
  getMiningPlans() {
    return this.adminService.getMiningPlans();
  }

  @Post("mining-plans")
  @RequireAdminPermission("mining.edit")
  createMiningPlan(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateMiningPlanDto,
  ) {
    const { reason, idempotencyKey, ...plan } = body;
    return this.adminService.createMiningPlan(plan, {
      adminId: request.user.userId,
      reason,
      idempotencyKey,
    });
  }

  @Patch("mining-plans/:id")
  @RequireAdminPermission("mining.edit")
  updateMiningPlan(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateMiningPlanDto,
  ) {
    const { reason, idempotencyKey, ...patch } = body;
    return this.adminService.updateMiningPlan(id, patch, {
      adminId: request.user.userId,
      reason,
      idempotencyKey,
    });
  }

  // --- Loan Plans ---
  @Get("loan-plans")
  @RequireAdminPermission("loans.view")
  getLoanPlans() {
    return this.adminService.getLoanPlans();
  }

  @Post("loan-plans")
  @RequireAdminPermission("loans.edit")
  createLoanPlan(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateLoanPlanDto,
  ) {
    const { reason, idempotencyKey, ...plan } = body;
    return this.adminService.createLoanPlan(plan, {
      adminId: request.user.userId,
      reason,
      idempotencyKey,
    });
  }

  @Patch("loan-plans/:id")
  @RequireAdminPermission("loans.edit")
  updateLoanPlan(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateLoanPlanDto,
  ) {
    const { reason, idempotencyKey, ...patch } = body;
    return this.adminService.updateLoanPlan(id, patch, {
      adminId: request.user.userId,
      reason,
      idempotencyKey,
    });
  }

  @Get("mining/subscriptions")
  @RequireAdminPermission("mining.view")
  getMiningSubscriptions() {
    return this.miningService.getAllSubscriptions();
  }

  @Get("loans/applications")
  @RequireAdminPermission("loans.view")
  getLoanApplications() {
    return this.loanService.getAllLoans();
  }

  @Post("loans/applications/:id/approve")
  @RequireAdminPermission("loans.edit")
  approveLoanApplication(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: LoanAdminDecisionDto,
  ) {
    return this.loanService.approveLoan(id, body.idempotencyKey, {
      adminId: request.user.userId,
      reason: body.reason,
    });
  }

  @Post("loans/applications/:id/reject")
  @RequireAdminPermission("loans.edit")
  rejectLoanApplication(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: LoanAdminDecisionDto,
  ) {
    return this.loanService.rejectLoan(id, body.idempotencyKey, {
      adminId: request.user.userId,
      reason: body.reason,
    });
  }

  @Get("risk/pairs")
  @RequireAdminPermission("binary.view")
  getBinaryPairs() {
    return this.adminService.getBinaryPairs();
  }

  @Get("binary/config")
  @RequireAdminPermission("binary.view")
  getBinaryConfiguration(@Query("pair") pair?: string) {
    return this.adminService.getBinaryConfigurations(pair);
  }

  @Post("binary/config")
  @RequireAdminPermission("binary.edit")
  updateBinaryConfiguration(
    @Body() body: UpdateBinaryConfigurationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.updateBinaryConfiguration(
      body,
      request.user.userId,
    );
  }
}
