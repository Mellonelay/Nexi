import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { WorkflowCommandsService } from "./workflow-commands.service";
import { WorkflowCommandDto } from "./workflow-command.dto";

@ApiTags("Internal Workflows")
@Controller("_internal/workflows")
export class WorkflowCommandsController {
  constructor(private readonly commands: WorkflowCommandsService) {}

  @Post(":workflow/:action")
  @ApiOperation({
    summary: "Execute an authenticated Workflow-facing NestJS command",
  })
  @ApiParam({ name: "workflow", enum: ["withdrawal", "mining", "loan"] })
  @ApiParam({ name: "action", description: "Workflow-specific action" })
  @ApiHeader({
    name: "x-nexi-workflow-signature",
    required: true,
    description: "HMAC-SHA256 workflow command signature",
  })
  @ApiHeader({
    name: "x-nexi-workflow-timestamp",
    required: true,
    description: "Unix timestamp in milliseconds; maximum age five minutes",
  })
  @ApiResponse({ status: 200, description: "D1-authoritative command result" })
  @ApiBadRequestResponse({
    description: "Invalid workflow, action, entity, or idempotency input",
  })
  @ApiUnauthorizedResponse({
    description: "Missing, expired, or invalid workflow signature",
  })
  @ApiNotFoundResponse({ description: "Workflow entity was not found" })
  async execute(
    @Param("workflow") workflow: string,
    @Param("action") action: string,
    @Body() body: WorkflowCommandDto,
    @Headers("x-nexi-workflow-signature") signature?: string,
    @Headers("x-nexi-workflow-timestamp") timestamp?: string,
  ) {
    const input = {
      workflow,
      action,
      instanceId: body.instanceId,
      entityId: body.entityId,
      idempotencyKey: body.idempotencyKey,
      payload: body.payload ?? {},
    };
    this.commands.assertSignature(input, signature, timestamp);
    return this.commands.execute(input);
  }
}
