import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { D1PrismaModule } from "../d1/d1-prisma.module";
import { D1CommunicationsCommandGateway } from "../d1/d1-communications-command.gateway";
import { EventsModule } from "../events/events.module";
import { RedisModule } from "../redis/redis.module";
import { CommunicationsController } from "./communications.controller";
import { CommunicationsService } from "./communications.service";
import { CommunicationsGateway } from "./communications.gateway";

@Module({
  imports: [AuthModule, PrismaModule, D1PrismaModule, RedisModule, EventsModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, CommunicationsGateway, D1CommunicationsCommandGateway],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
