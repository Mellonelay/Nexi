import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import { EventOutboxService } from "./event-outbox.service";
import { isNexiEventEnvelope, NexiEventEnvelope } from "./event-envelope";

const MAX_QUEUE_AGE_MS = 5 * 60 * 1000;

@ApiTags("Internal Events")
@Controller("_internal/events")
export class EventsController {
  constructor(
    private readonly events: EventOutboxService,
    private readonly config: ConfigService,
  ) {}

  @Post("queue")
  async ingestQueue(
    @Body() body: unknown,
    @Headers("x-nexi-event-signature") signature: string | undefined,
    @Headers("x-nexi-event-timestamp") timestampHeader: string | undefined,
  ) {
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new BadRequestException("Invalid queue body");
    const input = body as Record<string, unknown>;
    const queue = typeof input.queue === "string" ? input.queue : "";
    const messageId =
      typeof input.messageId === "string" ? input.messageId : "";
    const attempts =
      typeof input.attempts === "number" && Number.isInteger(input.attempts)
        ? input.attempts
        : 0;
    const event = input.event;
    if (
      !queue ||
      queue.length > 128 ||
      !messageId ||
      messageId.length > 128 ||
      attempts < 1 ||
      !isNexiEventEnvelope(event)
    ) {
      throw new BadRequestException("Invalid queue envelope");
    }
    this.assertWorkerSignature(
      queue,
      messageId,
      event,
      signature,
      timestampHeader,
    );
    return this.events.recordQueueIngress(
      queue,
      messageId,
      attempts,
      event as NexiEventEnvelope,
    );
  }

  private assertWorkerSignature(
    queue: string,
    messageId: string,
    event: NexiEventEnvelope,
    signature: string | undefined,
    timestampHeader: string | undefined,
  ): void {
    const secret = this.config.get<string>("JWT_SECRET");
    const timestamp = Number(timestampHeader);
    if (
      !secret ||
      !signature ||
      !Number.isFinite(timestamp) ||
      Math.abs(Date.now() - timestamp) > MAX_QUEUE_AGE_MS
    ) {
      throw new UnauthorizedException("Queue ingress authentication failed");
    }
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}:${queue}:${messageId}:${event.idempotencyKey}`)
      .digest("hex");
    const actual = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (
      actual.length !== expectedBuffer.length ||
      !timingSafeEqual(actual, expectedBuffer)
    ) {
      throw new UnauthorizedException("Queue ingress authentication failed");
    }
  }
}
