import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OwnershipGuard } from "../auth/ownership.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { KycSubmissionDto } from "../auth/auth.dto";
import { KycService } from "./kyc.service";
import { KycAdminTargetDto } from "./kyc.dto";

@ApiTags("KYC")
@Controller("kyc")
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post("submit")
  @UseGuards(JwtAuthGuard)
  async submitKyc(
    @Body() body: KycSubmissionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.kycService.submitKyc(request.user.userId, body);
  }

  @Get("status")
  @UseGuards(JwtAuthGuard)
  async getMyStatus(@Req() request: AuthenticatedRequest) {
    return this.kycService.getKycStatus(request.user.userId);
  }

  @Get("status/:userId")
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getStatus(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.kycService.getKycStatus(request.user.userId);
  }

  // Admin Endpoints
  @Post("admin/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approve(@Body() body: KycAdminTargetDto) {
    return this.kycService.approveKyc(body.userId);
  }

  @Post("admin/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async reject(@Body() body: KycAdminTargetDto) {
    return this.kycService.rejectKyc(body.userId);
  }
}
