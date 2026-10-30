import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiGoneResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { ConversionService } from "./conversion.service";
import {
  ConversionRateQueryDto,
  ConvertDto,
  SetConversionRateDto,
} from "./conversion.dto";

@ApiTags("Conversion")
@Controller("conversion")
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Get("rate")
  @ApiGoneResponse({ description: "Legacy conversion route is disabled; use the Gate 2 financial conversion API." })
  async getRate(@Query() query: ConversionRateQueryDto) {
    const rate = await this.conversionService.getRate(query.from, query.to);
    return { rate };
  }

  @ApiBearerAuth()
  @Post("convert")
  @ApiGoneResponse({ description: "Legacy conversion route is disabled; use the Gate 2 financial conversion API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async convert(
    @Body() body: ConvertDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.conversionService.convert(
      request.user.userId,
      body.from,
      body.to,
      body.amount,
    );
  }

  // Admin: Set Rate
  @ApiBearerAuth()
  @Post("admin/rate")
  @ApiGoneResponse({ description: "Legacy conversion route is disabled; use the Gate 2 financial conversion API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async setRate(@Body() body: SetConversionRateDto) {
    return this.conversionService.updateRate(body.pair, body.rate);
  }
}
