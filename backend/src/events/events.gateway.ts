import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, string>(); // socketId -> userId

  constructor(private readonly prisma: PrismaService) {
    this.startHeartbeatMonitor();
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

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(client: Socket, payload: { userId?: string }) {
    if (payload.userId) {
      this.connectedClients.set(client.id, payload.userId);
      
      // Update Last Active in DB (Optimization: Don't await this to keep WS fast)
      this.prisma.user.update({
        where: { id: payload.userId },
        data: { lastActive: new Date() }
      }).catch(err => {}); // Fire and forget
    }
    
    // Respond with Pong (optional)
    return { status: 'alive' };
  }

  @SubscribeMessage('join_admin')
  handleJoinAdmin(client: Socket) {
    client.join('admin_room');
    this.broadcastSystemMetrics(); // Send initial state
  }

  // Broadcast Metrics to Admin Room
  private broadcastSystemMetrics() {
    const uniqueUsers = new Set(this.connectedClients.values()).size;
    this.server.to('admin_room').emit('systemMetrics', {
      onlineUsers: uniqueUsers,
      totalConnections: this.connectedClients.size,
      timestamp: new Date().toISOString()
    });
  }

  // Periodic Pulse (Every 5 seconds)
  private startHeartbeatMonitor() {
    setInterval(() => {
      this.broadcastSystemMetrics();
    }, 5000);
  }
}
