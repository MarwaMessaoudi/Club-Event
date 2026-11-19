import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Every connection must present a valid ACCESS token (same JWT as REST).
   * On success: auto-join 'global' + the personal room 'user:{id}'.
   */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('missing token');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      client.join('global');
      client.join(`user:${payload.sub}`);
      this.logger.log(`socket connected: ${payload.email}`);
    } catch {
      client.disconnect(true); // invalid/expired token → no socket
    }
  }

  handleDisconnect(client: Socket) {
    const email = client.data?.user?.email;
    if (email) this.logger.log(`socket disconnected: ${email}`);
  }

  /** Client asks to join a room (e.g. club:{id}). Membership check happens
   *  in the feature service that approves the join — the gateway only
   *  performs what it's told via RealtimeService. */
}

export interface SocketUser {
  id: string;
  email: string;
  role: string;
}