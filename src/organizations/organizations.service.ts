import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; slug: string }) {
    const existing = await this.prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictException('Slug já está em uso');
    }
    return this.prisma.organization.create({ data });
  }

  async findAll({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take: limit,
        include: { subscription: { include: { plan: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        memberships: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    return org;
  }

  async update(id: string, data: { name?: string; slug?: string }) {
    if (data.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (existing) throw new ConflictException('Slug já está em uso');
    }
    return this.prisma.organization.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.organization.delete({ where: { id } });
  }

  async getMembers(id: string) {
    return this.prisma.membership.findMany({
      where: { organizationId: id },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUsage(id: string, { startDate, endDate }: { startDate?: string; endDate?: string }) {
    const where: any = { organizationId: id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    return this.prisma.usageDaily.findMany({ where, orderBy: { date: 'desc' } });
  }
}
