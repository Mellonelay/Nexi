import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CommunicationsService } from "./communications.service";
import {
  AdminMutationDto,
  AssignTicketDto,
  CreateAnnouncementDto,
  CreateLearnCategoryDto,
  CreateLearnContentDto,
  CreateTicketDto,
  PageQueryDto,
  ReplyTicketDto,
  SendMessageDto,
  UpdateAnnouncementDto,
  UpdateLearnContentDto,
  SendNotificationDto,
} from "./communications.dto";

@ApiTags("Communications")
@Controller("communications")
export class CommunicationsController {
  constructor(private readonly service: CommunicationsService) {}
  @Post("tickets") @UseGuards(JwtAuthGuard) createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTicketDto,
  ) {
    return this.service.createTicket(
      req.user.userId,
      dto.subject,
      dto.body,
      dto.idempotencyKey,
    );
  }
  @Get("tickets") @UseGuards(JwtAuthGuard) tickets(
    @Req() req: AuthenticatedRequest,
    @Query() q: PageQueryDto,
  ) {
    return this.service.listTickets(req.user.userId, q.page, q.limit);
  }
  @Post("tickets/:id/replies") @UseGuards(JwtAuthGuard) reply(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: ReplyTicketDto,
  ) {
    return this.service.reply(
      req.user.userId,
      id,
      dto.body,
      dto.idempotencyKey,
      dto.internal,
      dto.attachments,
      req.user.role,
    );
  }
  @Post("tickets/:id/assign")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  assign(@Param("id") id: string, @Body() dto: AssignTicketDto) {
    return this.service.assign(id, dto.assignedToId);
  }
  @Post("messages") @UseGuards(JwtAuthGuard) message(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(
      req.user.userId,
      dto.recipientId,
      dto.body,
      dto.idempotencyKey,
      dto.attachments,
    );
  }
  @Post("messages/:id/read") @UseGuards(JwtAuthGuard) readMessage(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.markMessageRead(req.user.userId, id);
  }
  @Get("messages") @UseGuards(JwtAuthGuard) messages(
    @Req() req: AuthenticatedRequest,
    @Query() q: PageQueryDto,
  ) {
    return this.service.listMessages(req.user.userId, q.page, q.limit);
  }
  @Get("notifications") @UseGuards(JwtAuthGuard) notifications(
    @Req() req: AuthenticatedRequest,
    @Query() q: PageQueryDto,
  ) {
    return this.service.listNotifications(req.user.userId, q.page, q.limit);
  }
  @Post("notifications/:id/read") @UseGuards(JwtAuthGuard) read(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.service.markNotificationRead(req.user.userId, id);
  }
  @Get("announcements") announcements() {
    return this.service.announcements();
  }
  @Get("learn") learn() {
    return this.service.learn();
  }
  @Get("learn/categories") learnCategories() {
    return this.service.listLearnCategories();
  }
  @Get("learn/:slug") learnDetail(@Param("slug") slug: string) {
    return this.service.learnDetail(slug);
  }
  @Post("admin/announcements")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createAnnouncement(@Body() dto: CreateAnnouncementDto) {
    return this.service.createAnnouncement(dto);
  }
  @Patch("admin/announcements/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateAnnouncement(@Param("id") id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.updateAnnouncement(id, dto);
  }
  @Post("admin/announcements/:id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  publishAnnouncement(@Param("id") id: string, @Body() dto: AdminMutationDto) {
    return this.service.publishAnnouncement(id, dto.idempotencyKey);
  }
  @Get("admin/messages") @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  adminMessages(@Query() q: PageQueryDto) { return this.service.adminMessages(q.page, q.limit); }
  @Get("admin/notifications") @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  adminNotifications(@Query() q: PageQueryDto) { return this.service.adminNotifications(q.page, q.limit); }
  @Post("admin/notifications") @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  sendAdminNotification(@Body() dto: SendNotificationDto) { return this.service.sendAdminNotification(dto); }
  @Get("admin/learn/articles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminLearnArticles() {
    return this.service.adminLearnArticles();
  }
  @Post("admin/learn/categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createLearnCategory(@Body() dto: CreateLearnCategoryDto) {
    return this.service.createLearnCategory(dto);
  }
  @Post("admin/learn")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createLearn(@Body() dto: CreateLearnContentDto) {
    return this.service.createLearn(dto);
  }
  @Patch("admin/learn/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateLearn(@Param("id") id: string, @Body() dto: UpdateLearnContentDto) {
    return this.service.updateLearn(id, dto);
  }
  @Post("admin/learn/:id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  publishLearn(@Param("id") id: string, @Body() dto: AdminMutationDto) {
    return this.service.publishLearn(id, dto.idempotencyKey);
  }
}
