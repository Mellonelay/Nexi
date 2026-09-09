import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ReadinessService } from './readiness.service';

@ApiTags("Operations")
@Controller("ops")
export class HealthController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get("live")
  live() {
    return { status: "ok", service: "nexi-api" };
  }

  @Get("ready")
  async ready() {
    return this.readinessService.getOperationalReadiness();
  }
}
