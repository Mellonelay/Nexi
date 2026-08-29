import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../auth/auth.types";
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
  async getRate(@Query() query: ConversionRateQueryDto) {
    const rate = await this.conversionService.getRate(query.from, query.to);
    return { rate };
  }

  @Post("convert")
  @UseGuards(JwtAuthGuard)
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
  @Post("admin/rate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async setRate(@Body() body: SetConversionRateDto) {
    return this.conversionService.updateRate(body.pair, body.rate);
  }
}
