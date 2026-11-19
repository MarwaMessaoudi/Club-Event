import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getUserConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Post('direct/:targetUserId')
  getOrCreateDirect(
    @CurrentUser('id') userId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.chatService.getOrCreateDirectConversation(userId, targetUserId);
  }

  @Get('club/:clubId')
  getOrCreateClub(
    @Param('clubId') clubId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getOrCreateClubConversation(clubId, userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.getMessages(conversationId, userId, query);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, userId, dto);
  }

  @Get('contacts')
  searchContacts(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.searchUsers(userId, search);
  }
}