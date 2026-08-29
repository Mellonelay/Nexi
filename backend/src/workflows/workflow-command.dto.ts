import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsString, MaxLength } from "class-validator";

export class WorkflowCommandDto {
  @ApiProperty({ description: "Cloudflare Workflow instance identifier" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  instanceId!: string;

  @ApiProperty({ description: "D1 aggregate identifier" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  entityId!: string;

  @ApiProperty({ description: "Idempotency key for the Workflow command" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiProperty({ type: Object, required: false, default: {} })
  @IsObject()
  payload: Record<string, unknown> = {};
}
