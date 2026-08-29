import { Module } from "@nestjs/common";
import { EventsGateway } from "./events.gateway";
import { EventsController } from "./events.controller";
import { EventOutboxService } from "./event-outbox.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { AuthModule } from "../auth/auth.module";
import { D1PrismaModule } from "../d1/d1-prisma.module";

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, D1PrismaModule],
  controllers: [EventsController],
  providers: [EventsGateway, EventOutboxService],
  exports: [EventsGateway, EventOutboxService],
})
export class EventsModule {}
