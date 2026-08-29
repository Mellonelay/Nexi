import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger, OnModuleDestroy, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { isCorsOriginAllowed } from "../runtime/runtime.config";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../auth/auth.types";
import { Role } from "@prisma/client";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin)),
  },
})
export class EventsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, string>(); // socketId -> userId
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwt: JwtService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  afterInit() {
    this.startHeartbeatMonitor();
  }

  onModuleDestroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  handleConnection(client: Socket) {
    // Client connected
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedClients.get(client.id);
    if (userId) {
      this.connectedClients.delete(client.id);
      this.broadcastSystemMetrics();
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("heartbeat")
  async handleHeartbeat(client: Socket) {
    const userId = client.data.authenticatedUser?.sub;
    if (userId) {
      this.connectedClients.set(client.id, userId);

      // Update Last Active in DB (Optimization: Don't await this to keep WS fast)
      const activityWrite = this.d1?.isEnabled()
        ? this.d1.touchUserLastActive(userId)
        : this.prisma.user.update({
            where: { id: userId },
            data: { lastActive: new Date() },
          });
      activityWrite.catch(() => {}); // Fire and forget
    }

    // Respond with Pong (optional)
    return { status: "alive" };
  }

  @SubscribeMessage("join_admin")
  async handleJoinAdmin(client: Socket) {
    const payload = await this.authenticate(client);
    if (
      !payload ||
      payload.surface !== "ADMIN" ||
      payload.role !== Role.ADMIN
    ) {
      client.emit("error", { message: "Admin authentication is required" });
      return { ok: false };
    }
    client.data.authenticatedUser = payload;
    client.join("admin_room");
    this.broadcastSystemMetrics(); // Send initial state
    return { ok: true };
  }

  private async authenticate(client: Socket): Promise<JwtPayload | null> {
    const token = client.handshake.auth?.token;
    if (typeof token !== "string" || !token) return null;
    try {
      return await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  // Broadcast Metrics to Admin Room
  private broadcastSystemMetrics() {
    if (!this.server || !this.redisService.isAvailable()) {
      return;
    }
    const uniqueUsers = new Set(this.connectedClients.values()).size;
    this.server.to("admin_room").emit("systemMetrics", {
      onlineUsers: uniqueUsers,
      totalConnections: this.connectedClients.size,
      timestamp: new Date().toISOString(),
    });
  }

  // Periodic Pulse (Every 5 seconds)
  private startHeartbeatMonitor() {
    this.heartbeatTimer = setInterval(() => {
      this.broadcastSystemMetrics();
    }, 5000);
  }
}
