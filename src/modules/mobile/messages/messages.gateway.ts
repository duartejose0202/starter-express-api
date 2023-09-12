// src/chat/chat.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { Bind, Injectable } from '@nestjs/common';
import { MessageDocument } from './message.document';

@Injectable()
@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private messageService: MessagesService) {
  }

  @WebSocketServer()
  server: Server;

  socketMap: {
    [key: string]: Socket[];
  } = {};

  // constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const query: any = client.handshake.query;
      // const payload = this.jwtService.verify(token);
      this.addSocket(query.user_id, client);
      process.nextTick(async () => {
        const messages = await this.messageService.getMessages(query['app_id'], query.user_id);
        client.emit("allChats", messages);
      })
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const query: any = client.handshake.query;
    this.removeSocket(query.user_id, client);
  }

  @SubscribeMessage('message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { app_id: string; message: MessageDocument }) {
    await this.messageService.sendMessage(data.app_id, data.message);
    this.emitEvents(data.message.fromId, 'msgSent', data.message);
    this.emitEvents(data.message.toId, 'message', data.message);
  }

  @SubscribeMessage('read')
  async handleRead(@ConnectedSocket() client: Socket, @MessageBody() data: { app_id: string; message: MessageDocument }) {
    await this.messageService.readMessage(data.app_id, data.message);
    this.emitEvents(data.message.fromId, 'read', data.message);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
  }

  addSocket(userId, socket) {
    const sockets: any[] = this.getSockets(userId);
    if (sockets.indexOf(socket) == -1) {
      sockets.push(socket);
    }
    this.socketMap[`${userId}`] = sockets;
  }


  getSockets<Socket>(userId) {
    return this.socketMap[`${userId}`] || [];
  }

  removeSocket(userId, socket) {
    const sockets: any[] = this.getSockets(userId);
    const index = sockets.indexOf(socket);
    if (index != -1) {
      sockets.splice(index, 1);
    }
    this.socketMap[`${userId}`] = sockets;
  }

  emitEvents(userId, msg, obj) {
    const sockets: Socket[] = this.getSockets(userId);

    console.log('userId', userId, sockets);
    for (const socket of sockets) {
      console.log('socketId', socket.id);
      socket.emit(msg, obj);
    }
  }

}
