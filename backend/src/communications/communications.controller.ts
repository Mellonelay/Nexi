import {
  Body,
  Controller,
  GoneException,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AuthRateLimit } from "../auth/auth-rate-limit.decorator";
import { AuthRateLimitGuard } from "../auth/auth-rate-limit.guard";
import { AdminPermissionGuard } from "../admin/admin-permission.guard";
import { RequireAdminPermission } from "../admin/admin-permission.decorator";
import { CommunicationsService } from "./communications.service";
import { SUPPORT_ATTACHMENT_MAX_BYTES, type SupportUpload } from "./support-attachment-storage.service";
import {
  AdminMutationDto,
  CreateAnnouncementDto,
  CreateLearnCategoryDto,
  CreateLearnContentDto,
  ContentLocaleQueryDto,
  PageQueryDto,
  ReportConversationDto,
  ResolveMessageModerationDto,
  SendSupportMessageDto,
  AdminMessageResponseDto,
  AdminMessageModerationCaseResponseDto,
  MessageModerationCaseResponseDto,
  MessageReadResponseDto,
  SupportAttachmentResponseDto,
  SupportMessageResponseDto,
  SupportThreadResponseDto,
  UpdateAnnouncementDto,
  UpdateLearnCategoryStatusDto,
  UpdateLearnContentDto,
  SendNotificationDto,
} from "./communications.dto";

@ApiTags("Communications")
@Controller("communications")
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}
  @Get("support/thread")
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "A valid Public user session is required." })
  @ApiForbiddenResponse({ description: "The support conversation is restricted." })
  @ApiQuery({ name: "page", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiOkResponse({ type: SupportThreadResponseDto, description: "The customer's canonical NEXI support thread; messages is empty when none exist." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("PUBLIC")
  @Roles(Role.USER)
  supportThread(@Req() req: AuthenticatedRequest, @Query() q: PageQueryDto) {
    return this.service.supportThread(req.user.userId, q.page, q.limit);
  }
  @Post("support/messages")
  @ApiBearerAuth()
  @ApiBadRequestResponse({ description: "Message text or at least one valid attachment is required." })
  @ApiUnauthorizedResponse({ description: "A valid Public user session is required." })
  @ApiForbiddenResponse({ description: "The support conversation is restricted." })
  @ApiResponse({ status: 409, description: "The idempotency key was already used with a different message payload." })
  @ApiCreatedResponse({ type: SupportMessageResponseDto, description: "The persisted message in the canonical support conversation." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("PUBLIC")
  @Roles(Role.USER)
  supportMessage(@Req() req: AuthenticatedRequest, @Body() dto: SendSupportMessageDto) {
    return this.service.sendSupportMessage(req.user.userId, dto.body ?? "", dto.idempotencyKey, dto.attachmentIds);
  }
  @Post("support/attachments")
  @ApiBearerAuth()
  @ApiBadRequestResponse({ description: "File is missing, oversized, or not an allowed content type." })
  @ApiUnauthorizedResponse({ description: "A valid Public user session is required." })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } } })
  @ApiCreatedResponse({ type: SupportAttachmentResponseDto, description: "Private staged attachment reference for a later support message." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AuthRateLimitGuard)
  @RequireAuthSurface("PUBLIC")
  @AuthRateLimit("message-attachment")
  @Roles(Role.USER)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: SUPPORT_ATTACHMENT_MAX_BYTES, files: 1 } }))
  uploadSupportAttachment(@Req() req: AuthenticatedRequest, @UploadedFile() file?: SupportUpload) {
    return this.service.uploadSupportAttachment(req.user.userId, file);
  }
  @Get("support/attachments/:id")
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: "A valid Public user session is required." })
  @ApiForbiddenResponse({ description: "The attachment is not linked to this user's support conversation." })
  @ApiResponse({ status: 404, description: "The attachment does not exist or is unavailable to this user." })
  @ApiProduces("image/png", "image/jpeg", "image/webp", "application/pdf")
  @ApiOkResponse({ schema: { type: "string", format: "binary" }, description: "Private attachment; access is restricted to its conversation participant." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("PUBLIC")
  @Roles(Role.USER)
  @Header("X-Content-Type-Options", "nosniff")
  @Header("Cache-Control", "private, no-store")
  async getSupportAttachment(@Req() req: AuthenticatedRequest, @Param("id", ParseUUIDPipe) id: string) {
    const { attachment, body } = await this.service.getSupportAttachment(req.user.userId, id);
    return new StreamableFile(body, {
      type: attachment.mimeType,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      length: attachment.size,
    });
  }
  @Post("messages")
  @ApiBearerAuth()
  @ApiOperation({ deprecated: true, description: "Recipient-selected Public messaging is retired. Use the NEXI support conversation." })
  @ApiResponse({ status: 410, description: "Recipient-selected messaging has been retired." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("PUBLIC")
  @Roles(Role.USER)
  message() {
    throw new GoneException("Recipient-selected messaging is retired. Use the NEXI support conversation.");
  }
  @ApiBearerAuth()
  @Post("messages/:id/read")
  @ApiCreatedResponse({ type: MessageReadResponseDto, description: "The persisted message with its canonical read timestamp." })
  @ApiNotFoundResponse({ description: "Message not found or unavailable to this recipient." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  readMessage(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.markMessageRead(req.user.userId, id);
  }
  @ApiBearerAuth()
  @Get("messages")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  messages(
    @Req() req: AuthenticatedRequest,
    @Query() q: PageQueryDto,
  ) {
    return this.service.listMessages(req.user.userId, q.page, q.limit);
  }
  @ApiBearerAuth()
  @Get("conversations")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  conversations(
    @Req() req: AuthenticatedRequest,
    @Query() q: PageQueryDto,
  ) {
    return this.service.listConversations(req.user.userId, q.page, q.limit);
  }
  @ApiBearerAuth()
  @Post("conversations/:id/report")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  reportConversation(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReportConversationDto,
  ) {
    return this.service.reportConversation(
      req.user.userId,
      id,
      dto.reason,
      dto.messageId,
    );
  }
  @ApiBearerAuth()
  @Get("notifications")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  notifications(
    @Req() req: AuthenticatedRequest,
    @Query() q: PageQueryDto,
  ) {
    return this.service.listNotifications(req.user.userId, q.page, q.limit);
  }
  @ApiBearerAuth()
  @Post("notifications/:id/read")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  read(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.markNotificationRead(req.user.userId, id);
  }
  @Get("announcements") announcements(@Query() q: ContentLocaleQueryDto) {
    return this.service.announcements(q.locale);
  }
  @Get("learn") learn(@Query() q: ContentLocaleQueryDto) {
    return this.service.learn(q.locale);
  }
  @Get("learn/categories") learnCategories() {
    return this.service.listLearnCategories();
  }
  @Get("learn/:slug") learnDetail(
    @Param("slug") slug: string,
    @Query() q: ContentLocaleQueryDto,
  ) {
    return this.service.learnDetail(slug, q.locale);
  }
  @ApiBearerAuth()
  @Post("admin/announcements")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("announcements.publish")
  createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.service.createAnnouncement(dto);
  }
  @ApiBearerAuth()
  @Patch("admin/announcements/:id")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("announcements.publish")
  updateAnnouncement(@Param("id") id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.updateAnnouncement(id, dto);
  }
  @ApiBearerAuth()
  @Post("admin/announcements/:id/publish")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("announcements.publish")
  publishAnnouncement(@Param("id") id: string, @Body() dto: AdminMutationDto) {
    return this.service.publishAnnouncement(id, dto.idempotencyKey);
  }
  @Get("admin/messages")
  @ApiBearerAuth()
  @ApiQuery({ name: "page", required: false, type: 'integer', minimum: 1 })
  @ApiQuery({ name: "limit", required: false, type: 'integer', minimum: 1, maximum: 100 })
  @ApiOkResponse({ type: AdminMessageResponseDto, isArray: true, description: "Operator message records with canonical support-customer linkage." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("messages.view")
  adminMessages(@Query() q: PageQueryDto) {
    return this.service.adminMessages(q.page, q.limit);
  }
  @ApiBearerAuth()
  @Post("admin/messages/:id/read")
  @ApiCreatedResponse({ type: MessageReadResponseDto, description: "The persisted message with its canonical read timestamp." })
  @ApiNotFoundResponse({ description: "Message not found or unavailable to this administrator." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("messages.view")
  markAdminMessageRead(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.markAdminMessageRead(req.user.userId, id);
  }
  @Get("admin/messages/moderation")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("messages.view")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [AdminMessageModerationCaseResponseDto] })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  adminMessageModeration(@Query() q: PageQueryDto) {
    return this.service.adminMessageModeration(q.page, q.limit);
  }
  @Patch("admin/messages/moderation/:id")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("messages.send")
  @ApiBearerAuth()
  @ApiOkResponse({ type: MessageModerationCaseResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  @ApiNotFoundResponse({ description: "Moderation case not found" })
  resolveMessageModeration(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ResolveMessageModerationDto,
  ) {
    return this.service.resolveMessageModeration(id, req.user.userId, dto);
  }
  @ApiBearerAuth()
  @Get("admin/notifications")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("notifications.view")
  adminNotifications(@Query() q: PageQueryDto) { return this.service.adminNotifications(q.page, q.limit); }
  @ApiBearerAuth()
  @Post("admin/notifications")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("notifications.send")
  sendAdminNotification(@Body() dto: SendNotificationDto) { return this.service.sendAdminNotification(dto); }
  @ApiBearerAuth()
  @Get("admin/learn/articles")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.view")
  adminLearnArticles() {
    return this.service.adminLearnArticles();
  }
  @ApiBearerAuth()
  @Get("admin/learn/categories")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.view")
  adminLearnCategories() {
    return this.service.adminLearnCategories();
  }
  @ApiBearerAuth()
  @Post("admin/learn/categories")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.publish")
  createLearnCategory(@Body() dto: CreateLearnCategoryDto) {
    return this.service.createLearnCategory(dto);
  }
  @ApiBearerAuth()
  @Patch("admin/learn/categories/:id")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.publish")
  updateLearnCategoryStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: UpdateLearnCategoryStatusDto,
  ) {
    return this.service.updateLearnCategoryStatus(id, req.user.userId, dto);
  }
  @ApiBearerAuth()
  @Post("admin/learn")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.publish")
  createLearn(@Body() dto: CreateLearnContentDto) {
    return this.service.createLearn(dto);
  }
  @ApiBearerAuth()
  @Patch("admin/learn/:id")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.publish")
  updateLearn(@Param("id") id: string, @Body() dto: UpdateLearnContentDto) {
    return this.service.updateLearn(id, dto);
  }
  @ApiBearerAuth()
  @Post("admin/learn/:id/publish")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  @RequireAdminPermission("learn.publish")
  publishLearn(@Param("id") id: string, @Body() dto: AdminMutationDto) {
    return this.service.publishLearn(id, dto.idempotencyKey);
  }
}
