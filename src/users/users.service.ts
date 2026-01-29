import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { email: string; name: string; password?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email já está em uso');

    const { password, ...userData } = data;
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    
    return this.prisma.user.create({
      data: { ...userData, passwordHash },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });
  }

  async findAll({ page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        memberships: { include: { organization: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(id: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async getOrganizations(id: string) {
    return this.prisma.membership.findMany({
      where: { userId: id },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
