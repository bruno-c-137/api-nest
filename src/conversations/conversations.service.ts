import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TavusService } from '../tavus/tavus.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tavusService: TavusService,
  ) {}

  async create(data: { userId: string; language: string; tavusReplicaId?: string }) {
    return this.prisma.conversation.create({
      data: {
        ...data,
        status: 'pending',
      },
    });
  }

  /**
   * Inicia uma nova conversa na Tavus e salva no banco de dados
   * @param params - Parâmetros da conversa (language obrigatório, personaId e replicaId opcionais)
   * @returns conversationId e conversationUrl
   */
  async startConversation(params: {
    language: string;
    personaId?: string;
    replicaId?: string;
  }) {
    // Validar variáveis de ambiente
    const defaultPersonaId = process.env.TAVUS_PERSONA_ID;
    const defaultReplicaId = process.env.TAVUS_REPLICA_ID;

    const personaId = params.personaId || defaultPersonaId;
    const replicaId = params.replicaId || defaultReplicaId;

    if (!personaId) {
      throw new BadRequestException(
        'personaId não fornecido e TAVUS_PERSONA_ID não está definido no ambiente',
      );
    }

    if (!replicaId) {
      throw new BadRequestException(
        'replicaId não fornecido e TAVUS_REPLICA_ID não está definido no ambiente',
      );
    }

    // Chamar Tavus API para criar conversa
    const { conversationUrl, tavusConversationId } =
      await this.tavusService.createConversation({
        personaId,
        replicaId,
        language: params.language,
      });

    if (!conversationUrl) {
      throw new BadRequestException('Tavus não retornou conversation_url');
    }

    // Salvar no banco de dados
    // Para MVP, usar userId fixo "demo-user-id"
    const conversation = await this.prisma.conversation.create({
      data: {
        userId: 'demo-user-id',
        language: params.language,
        status: 'active',
        conversationUrl,
        tavusConversationId,
        tavusReplicaId: replicaId,
        startedAt: new Date(),
      },
    });

    return {
      conversationId: conversation.id,
      conversationUrl: conversation.conversationUrl,
    };
  }

  async findAll({
    userId,
    status,
    page,
    limit,
  }: {
    userId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');
    return conversation;
  }

  async start(id: string, tavusSessionId: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'active',
        tavusSessionId,
        startedAt: new Date(),
      },
    });
  }

  async end(id: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversa não encontrada');

    const durationSeconds = conversation.startedAt
      ? Math.floor((Date.now() - conversation.startedAt.getTime()) / 1000)
      : null;

    return this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'completed',
        endedAt: new Date(),
        durationSeconds,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.conversation.delete({ where: { id } });
  }

  async getMessages(id: string) {
    return this.prisma.message.findMany({
      where: { conversationId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
