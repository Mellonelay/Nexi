import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ReadinessService } from './readiness.service';

@ApiTags("Operations")
@Controller("ops")
export class HealthController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get("live")
  @ApiOkResponse({ schema: { type: "object", required: ["status", "service"], properties: { status: { type: "string", enum: ["ok"] }, service: { type: "string", enum: ["nexi-api"] } } } })
  live() {
    return { status: "ok", service: "nexi-api" };
  }

  @Get("ready")
  async ready() {
    return this.readinessService.getOperationalReadiness();
  }
}
