import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { UserStatus } from '../users/entities/user-status.enum';
import { Club } from '../clubs/entities/club.entity';
import { ClubsService } from '../clubs/clubs.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { Paginated, paginate } from '../common/interfaces/paginated';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,

    @InjectRepository(ConversationParticipant)
    private readonly partRepo: Repository<ConversationParticipant>,

    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    private readonly clubsService: ClubsService,
    private readonly realtime: RealtimeService,
  ) {}

  // ------------------------------------------------------------------
  // Conversations List & Discovery
  // ------------------------------------------------------------------

  async getUserConversations(userId: string) {
    // 1. Ensure user is in conversation participants for all their approved clubs
    const approvedClubs = await this.clubsService.findAll(
      { page: 1, limit: 100 } as any,
      userId,
      UserRole.STUDENT,
    );

    for (const club of approvedClubs.data) {
      if (club.isMember) {
        await this.ensureClubConversationAndParticipant(club.id, userId);
      }
    }

    // 2. Fetch all conversations the user is a participant of
    const participations = await this.partRepo.find({
      where: { user: { id: userId } },
      relations: {
        conversation: {
          club: true,
          participants: { user: true },
        },
      },
    });

    const conversations = participations.map((p) => p.conversation);

    // 3. Attach last message and metadata
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await this.msgRepo.findOne({
          where: { conversation: { id: conv.id } },
          order: { createdAt: 'DESC' },
          relations: { sender: true },
        });

        // Other participant if direct
        const otherParticipant =
          conv.type === ConversationType.DIRECT
            ? conv.participants.find((pt) => pt.user.id !== userId)?.user ?? null
            : null;

        return {
          id: conv.id,
          type: conv.type,
          club: conv.club,
          otherParticipant,
          lastMessage: lastMsg,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      }),
    );

    return enriched.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  }

  // ------------------------------------------------------------------
  // Direct Messages (1-to-1)
  // ------------------------------------------------------------------

  async getOrCreateDirectConversation(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ConflictException('You cannot create a conversation with yourself');
    }

    const targetUser = await this.usersRepo.findOne({
      where: { id: targetUserId, status: UserStatus.ACTIVE },
    });

    if (!targetUser) {
      throw new NotFoundException('Recipient user not found or suspended');
    }

    // Find existing direct conversation between these two users
    const myParticipations = await this.partRepo.find({
      where: { user: { id: userId } },
      relations: { conversation: true },
    });

    for (const part of myParticipations) {
      if (part.conversation.type === ConversationType.DIRECT) {
        const match = await this.partRepo.findOne({
          where: {
            conversation: { id: part.conversation.id },
            user: { id: targetUserId },
          },
        });

        if (match) {
          return part.conversation;
        }
      }
    }

    // If none exists, create new direct conversation
    const conv = await this.convRepo.save(
      this.convRepo.create({
        type: ConversationType.DIRECT,
        club: null,
        lastMessageAt: new Date(),
      }),
    );

    await this.partRepo.save([
      this.partRepo.create({ conversation: conv, user: { id: userId } as User }),
      this.partRepo.create({ conversation: conv, user: { id: targetUserId } as User }),
    ]);

    return conv;
  }

  // ------------------------------------------------------------------
  // Club Group Chat
  // ------------------------------------------------------------------

  async getOrCreateClubConversation(clubId: string, userId: string) {
    await this.clubsService.assertMember(clubId, userId);
    return this.ensureClubConversationAndParticipant(clubId, userId);
  }

  private async ensureClubConversationAndParticipant(clubId: string, userId: string) {
    let conv = await this.convRepo.findOne({
      where: { club: { id: clubId }, type: ConversationType.CLUB },
      relations: { club: true },
    });

    if (!conv) {
      conv = await this.convRepo.save(
        this.convRepo.create({
          type: ConversationType.CLUB,
          club: { id: clubId } as Club,
          lastMessageAt: new Date(),
        }),
      );
    }

    const isParticipant = await this.partRepo.findOne({
      where: { conversation: { id: conv.id }, user: { id: userId } },
    });

    if (!isParticipant) {
      await this.partRepo.save(
        this.partRepo.create({
          conversation: conv,
          user: { id: userId } as User,
        }),
      );
    }

    return conv;
  }

  // ------------------------------------------------------------------
  // Messages Feed & Transmission
  // ------------------------------------------------------------------

    async getMessages(conversationId: string, userId: string, query: MessageQueryDto) {
    await this.assertAccess(conversationId, userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const qb = this.msgRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('m.conversation = :conversationId', { conversationId })
      .orderBy('m.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [messages, total] = await qb.getManyAndCount();

    return paginate(messages, total, page, limit);
  }

  private async assertAccess(conversationId: string, userId: string) {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: { club: true },
    });

    if (!conv) {
      throw new NotFoundException('Conversation not found');
    }

    if (conv.type === ConversationType.CLUB && conv.club) {
      await this.clubsService.assertMember(conv.club.id, userId);
      return;
    }

    const isParticipant = await this.partRepo
      .createQueryBuilder('p')
      .where('p.conversation = :conversationId', { conversationId })
      .andWhere('p.user = :userId', { userId })
      .getOne();

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
  }

  async sendMessage(conversationId: string, userId: string, dto: SendMessageDto) {
    await this.assertAccess(conversationId, userId);

    const message = await this.msgRepo.save(
      this.msgRepo.create({
        conversation: { id: conversationId } as Conversation,
        sender: { id: userId } as User,
        content: dto.content.trim(),
      }),
    );

    await this.convRepo.update(conversationId, {
      lastMessageAt: new Date(),
    });

    const fullMessage = await this.msgRepo.findOne({
      where: { id: message.id },
      relations: { sender: true },
    });

    // Notify all participants in real time via their personal user rooms
    const participants = await this.partRepo.find({
      where: { conversation: { id: conversationId } },
      relations: { user: true },
    });

    for (const p of participants) {
      this.realtime.emitToUser(p.user.id, 'chat.message.received', {
        conversationId,
        message: fullMessage,
      });
    }

    return fullMessage;
  }

  // Search users across the campus to start a 1-to-1 conversation
  async searchUsers(currentUserId: string, search = '') {
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .where('u.id != :currentUserId', { currentUserId })
      .andWhere('u.status = :status', { status: UserStatus.ACTIVE })
      .orderBy('u.firstName', 'ASC')
      .limit(20);

    if (search.trim()) {
      qb.andWhere(
        '(u.firstName ILIKE :q OR u.lastName ILIKE :q OR u.email ILIKE :q)',
        { q: `%${search.trim()}%` },
      );
    }

    return qb.getMany();
  }

 
}