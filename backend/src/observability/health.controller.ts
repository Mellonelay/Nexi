import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
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
  @ApiOkResponse({ description: "Operational readiness; returned when SQLite and Redis are ready.", schema: { type: "object", required: ["status", "dependencies"], properties: { status: { type: "string", enum: ["ready"] }, dependencies: { type: "object", required: ["database", "redis"], properties: { database: { type: "boolean", enum: [true] }, redis: { type: "boolean", enum: [true] } } } } } })
  @ApiServiceUnavailableResponse({ description: "SQLite or Redis is not ready; includes the current dependency flags." })
  async ready() {
    return this.readinessService.getOperationalReadiness();
  }
}
