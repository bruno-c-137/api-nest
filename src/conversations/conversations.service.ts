import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { organizationId: string; tavusReplicaId?: string; metadata?: any }) {
    return this.prisma.conversation.create({
      data: {
        ...data,
        status: 'pending',
        metadata: data.metadata || undefined,
      },
    });
  }

  async findAll({
    organizationId,
    status,
    page,
    limit,
  }: {
    organizationId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        include: {
          organization: { select: { id: true, name: true, slug: true } },
          _count: { select: { messages: true, events: true } },
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
        organization: true,
        consent: true,
        _count: { select: { messages: true, events: true } },
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
      orderBy: { timestamp: 'asc' },
    });
  }

  async getEvents(id: string, eventType?: string) {
    const where: any = { conversationId: id };
    if (eventType) where.eventType = eventType;
    return this.prisma.conversationEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
  }
}
