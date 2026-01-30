import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TavusService } from '../tavus/tavus.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tavusService: TavusService,
  ) { }

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
    userId: string;
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

    // Construir callback URL
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    const callbackUrl = `${webhookBaseUrl}/webhooks/tavus`;

    // Chamar Tavus API para criar conversa
    const { conversationUrl, tavusConversationId } =
      await this.tavusService.createConversation({
        personaId,
        replicaId,
        language: params.language,
        callbackUrl,
      });

    if (!conversationUrl) {
      throw new BadRequestException('Tavus não retornou conversation_url');
    }

    // Salvar no banco de dados com o userId autenticado
    const conversation = await this.prisma.conversation.create({
      data: {
        userId: params.userId,
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

  async saveTranscript(
    conversationId: string,
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      externalEventId?: string;
      createdAt?: string;
    }>,
  ) {
    // Verificar se a conversa existe
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Buscar externalEventIds existentes para deduplicação
    const existingEventIds = messages
      .map((m) => m.externalEventId)
      .filter((id): id is string => !!id);

    const existingMessages = await this.prisma.message.findMany({
      where: {
        conversationId,
        externalEventId: { in: existingEventIds },
      },
      select: { externalEventId: true },
    });

    const existingEventIdsSet = new Set(
      existingMessages.map((m) => m.externalEventId).filter((id): id is string => !!id),
    );

    // Filtrar mensagens não duplicadas
    const messagesToSave = messages.filter((msg) => {
      if (msg.externalEventId && existingEventIdsSet.has(msg.externalEventId)) {
        return false; // Skip duplicado
      }
      return true;
    });

    // Salvar mensagens em transação
    const savedMessages = await this.prisma.$transaction(
      messagesToSave.map((msg) =>
        this.prisma.message.create({
          data: {
            conversationId,
            userId: conversation.userId,
            role: msg.role,
            content: msg.content,
            externalEventId: msg.externalEventId,
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          },
        }),
      ),
    );

    return {
      savedCount: savedMessages.length,
      skippedCount: messages.length - messagesToSave.length,
    };
  }

  async endConversation(conversationId: string, endedAt?: string) {
    // Verificar se a conversa existe
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Atualizar status e endedAt
    const updatedConversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'ended',
        endedAt: endedAt ? new Date(endedAt) : new Date(),
      },
    });

    // Retornar conversa atualizada com aviso sobre webhook
    return {
      ...updatedConversation,
      webhookStatus: updatedConversation.transcriptReceived 
        ? 'Transcrição já foi recebida via webhook' 
        : 'Aguardando webhook da Tavus com a transcrição (2-5 minutos)',
    };
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

  async importTranscriptFromTavus(conversationId: string) {
    // Verificar se a conversa existe
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    if (!conversation.tavusConversationId) {
      throw new BadRequestException('Conversa não tem tavusConversationId associado');
    }

    // Buscar transcrição da Tavus
    const transcript = await this.tavusService.getConversationTranscript(
      conversation.tavusConversationId,
    );

    // Converter formato Tavus para formato interno
    // Nota: O formato exato depende da resposta da API Tavus
    // Ajuste conforme necessário baseado na documentação
    const messages = this.parseTavusTranscript(transcript);

    // Salvar mensagens
    return this.saveTranscript(conversationId, messages);
  }

  async debugTavusConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    if (!conversation.tavusConversationId) {
      throw new BadRequestException('Conversa não tem tavusConversationId');
    }

    try {
      // Buscar dados da conversa
      const conversationData = await this.tavusService.getConversation(
        conversation.tavusConversationId,
      );

      // Tentar buscar transcrição
      let transcriptData = null;
      let transcriptError: string | null = null;
      try {
        transcriptData = await this.tavusService.getConversationTranscript(
          conversation.tavusConversationId,
        );
      } catch (error) {
        transcriptError = error instanceof Error ? error.message : String(error);
      }

      return {
        tavusConversationId: conversation.tavusConversationId,
        conversationData,
        transcriptData,
        transcriptError,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'Erro ao buscar dados da Tavus',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private parseTavusTranscript(transcript: any): Array<{
    role: 'user' | 'assistant';
    content: string;
    externalEventId?: string;
    createdAt?: string;
  }> {
    // Adapte conforme o formato real da resposta da Tavus
    // Exemplo genérico:
    if (Array.isArray(transcript?.messages)) {
      return transcript.messages.map((msg: any) => ({
        role: msg.speaker === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.content || '',
        externalEventId: msg.id || msg.event_id,
        createdAt: msg.timestamp || msg.created_at,
      }));
    }

    // Se for outro formato, ajuste aqui
    return [];
  }
}
