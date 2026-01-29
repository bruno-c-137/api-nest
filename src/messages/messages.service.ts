import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    conversationId: string;
    userId?: string;
    role: string;
    content: string;
    transcription?: string;
    metadata?: any;
  }) {
    return this.prisma.message.create({
      data: {
        ...data,
        metadata: data.metadata || undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findByConversation(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findOne(id: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        conversation: { select: { id: true, organizationId: true } },
      },
    });
    if (!message) throw new NotFoundException('Mensagem não encontrada');
    return message;
  }

  async remove(id: string) {
    return this.prisma.message.delete({ where: { id } });
  }
}
