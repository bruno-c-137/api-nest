import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    planId: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const existing = await this.prisma.subscription.findUnique({
      where: { organizationId: data.organizationId },
    });
    if (existing) throw new ConflictException('Organização já possui assinatura');

    return this.prisma.subscription.create({
      data: {
        ...data,
        currentPeriodStart: new Date(data.currentPeriodStart),
        currentPeriodEnd: new Date(data.currentPeriodEnd),
        status: 'active',
      },
      include: { plan: true, organization: true },
    });
  }

  async findByOrganization(organizationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true, organization: true },
    });
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');
    return subscription;
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, organization: true },
    });
    if (!subscription) throw new NotFoundException('Assinatura não encontrada');
    return subscription;
  }

  async update(id: string, data: { planId?: string; status?: string }) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: { plan: true },
    });
  }

  async cancel(id: string) {
    return this.prisma.subscription.update({
      where: { id },
      data: { cancelAtPeriodEnd: true },
    });
  }

  async remove(id: string) {
    return this.prisma.subscription.delete({ where: { id } });
  }
}
