import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { isCorsOriginAllowed } from '../runtime/runtime.config';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin)),
  },
})
export class BinaryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (typeof token !== 'string' || !token) {
      client.disconnect(true);
      return;
    }
    // The REST boundary remains the primary session authority. The gateway
    // only accepts a verified JWT subject and never trusts a client userId.
    try {
      const payload = this.jwtService.verify<{ sub?: string; surface?: string }>(token);
      if (typeof payload.sub !== 'string' || payload.surface === 'ADMIN') throw new Error('invalid socket claims');
      client.join(payload.sub);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    void client;
  }

  emitPositionUpdate(userId: string, payload: unknown): void {
    this.server?.to(userId).emit('binary_position_update', payload);
  }
}
