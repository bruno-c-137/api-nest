import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /**
   * Retorna perfil do usuário autenticado com suas conversas
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    // Extrair userId do objeto user
    const userId = user.userId || user.sub || user.id;

    const cacheKey = `user:profile:${userId}`;

    // Tentar buscar do cache (5 minutos)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Buscar dados do usuário
    const userData = await this.usersService.findOne(userId);

    // Buscar conversas do usuário
    const conversations = await this.usersService.getConversations(userId);

    // Função helper para converter UTC para horário de Brasília (formato ISO)
    const toBrasiliaTime = (date: Date | null): string | null => {
      if (!date) return null;

      // Obter a data/hora em Brasília
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(new Date(date));
      const getValue = (type: string) => parts.find((p) => p.type === type)?.value || '';

      // Montar string ISO manualmente no formato de Brasília
      const year = getValue('year');
      const month = getValue('month');
      const day = getValue('day');
      const hour = getValue('hour');
      const minute = getValue('minute');
      const second = getValue('second');

      // Retornar no formato ISO: YYYY-MM-DDTHH:mm:ss.sssZ
      const milliseconds = new Date(date).getMilliseconds().toString().padStart(3, '0');
      return `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}-03:00`;
    };

    // Retornar perfil com IDs das conversas
    const result = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      createdAt: toBrasiliaTime(userData.createdAt),
      stats: {
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        endedConversations: conversations.filter((c) => c.status === 'ended').length,
      },
      conversations: conversations.map((c) => ({
        id: c.id,
        tavusConversationId: c.tavusConversationId,
        status: c.status,
        language: c.language,
        conversationUrl: c.conversationUrl,
        startedAt: toBrasiliaTime(c.startedAt),
        endedAt: toBrasiliaTime(c.endedAt),
        createdAt: toBrasiliaTime(c.createdAt),
      })),
    };

    // Cachear por 5 minutos (300 segundos)
    await this.redis.set(cacheKey, result, 300);

    return result;
  }
}
