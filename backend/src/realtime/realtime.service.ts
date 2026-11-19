import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/**
 * Central real-time API. Feature services NEVER touch the gateway
 * or socket.io directly — they call this service. One day you swap
 * Socket.IO for Redis pub/sub (multi-instance), only this file changes.
 */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  /** Everyone connected (feed updates, reactions, comments). */
  emitToAll(event: string, payload: unknown): void {
    this.gateway.server.to('global').emit(event, payload);
  }

  /** One specific user (notifications, moderation results). */
  emitToUser(userId: string, event: string, payload: unknown): void {
    this.gateway.server.to(`user:${userId}`).emit(event, payload);
  }

  /** A named room: 'club:{id}', 'conversation:{id}', 'event:{id}'. */
  emitToRoom(room: string, event: string, payload: unknown): void {
    this.gateway.server.to(room).emit(event, payload);
  }

  /** Server-side room management (called after membership approval, etc.). */
  joinRoom(socketId: string, room: string): void {
    this.gateway.server.sockets.sockets.get(socketId)?.join(room);
  }
}