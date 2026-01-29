import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    displayName: string;
    description?: string;
    price: number;
    billingInterval: string;
    maxConversationsPerDay?: number;
    maxMinutesPerMonth?: number;
    features?: string[];
  }) {
    const existing = await this.prisma.plan.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Plano com esse nome já existe');

    return this.prisma.plan.create({ data });
  }

  async findAll() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } });
  }

  async findActive() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async update(id: string, data: any) {
    return this.prisma.plan.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }
}
