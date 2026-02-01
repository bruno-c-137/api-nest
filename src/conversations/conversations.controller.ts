import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SaveTranscriptDto } from './dto/save-transcript.dto';
import { EndConversationDto } from './dto/end-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  /**
   * Inicia uma nova conversa com avatar Tavus
   * POST /conversations/start
   * Requer autenticação JWT
   */
  @Post('start')
  async startConversation(
    @Body() dto: StartConversationDto,
    @CurrentUser() user: { userId: string; email: string; name: string },
  ) {
    return this.conversationsService.startConversation({
      userId: user.userId,
      language: dto.language,
      personaId: dto.personaId,
      replicaId: dto.replicaId,
    });
  }

  @Post()
  async create(@Body() data: { userId: string; language: string; tavusReplicaId?: string }) {
    return this.conversationsService.create(data);
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.findAll({ userId, status, page: page || 1, limit: limit || 10 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Put(':id/start')
  async start(@Param('id') id: string, @Body() data: { tavusSessionId: string }) {
    return this.conversationsService.start(id, data.tavusSessionId);
  }

  @Put(':id/end')
  async end(@Param('id') id: string) {
    return this.conversationsService.end(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getMessages(id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  /**
   * Salva transcrição em batch ao finalizar conversa
   * POST /conversations/:id/transcript
   */
  @Post(':id/transcript')
  async saveTranscript(@Param('id') id: string, @Body() dto: SaveTranscriptDto) {
    return this.conversationsService.saveTranscript(id, dto.messages);
  }

  /**
   * Marca conversa como encerrada
   * POST /conversations/:id/end
   */
  @Post(':id/end')
  async endConversation(@Param('id') id: string, @Body() dto: EndConversationDto) {
    return this.conversationsService.endConversation(id, dto.endedAt);
  }

  /**
   * Importa transcrição da Tavus automaticamente
   * POST /conversations/:id/import-transcript
   */
  @Post(':id/import-transcript')
  async importTranscript(@Param('id') id: string) {
    return this.conversationsService.importTranscriptFromTavus(id);
  }

  /**
   * Debug: Busca dados brutos da conversa na Tavus
   * GET /conversations/:id/tavus-debug
   */
  @Get(':id/tavus-debug')
  async tavusDebug(@Param('id') id: string) {
    return this.conversationsService.debugTavusConversation(id);
  }

  /**
   * Verifica status do webhook/transcrição
   * GET /conversations/:id/webhook-status
   */
  @Get(':id/webhook-status')
  @UseGuards(JwtAuthGuard)
  async getWebhookStatus(@Param('id') id: string, @CurrentUser() userId: string) {
    const conversation = await this.conversationsService.findOne(id);

    const messagesResult = await this.conversationsService.getMessages(id, { page: 1, limit: 1 });

    // Calcular tempo desde que a conversa terminou
    let waitingTime: number | null = null;
    if (conversation.status === 'ended' && conversation.endedAt && !conversation.transcriptReceived) {
      const minutesWaiting = Math.floor((Date.now() - new Date(conversation.endedAt).getTime()) / 1000 / 60);
      waitingTime = minutesWaiting;
    }

    // Verificar configuração do webhook
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL;
    const webhookConfigured = webhookBaseUrl && webhookBaseUrl !== 'http://localhost:3000';

    return {
      conversationId: conversation.id,
      status: conversation.status,
      transcriptReceived: conversation.transcriptReceived,
      messagesCount: messagesResult.total,
      waitingTimeMinutes: waitingTime,
      webhookConfigured: webhookConfigured,
      webhookUrl: webhookConfigured ? `${webhookBaseUrl}/webhooks/tavus` : null,
      message: conversation.transcriptReceived
        ? '✅ Webhook recebido! Transcrição disponível.'
        : conversation.status === 'ended'
          ? waitingTime && waitingTime > 10
            ? '⚠️ Webhook não recebido há mais de 10 minutos. Possível problema de configuração.'
            : `⏳ Aguardando webhook da Tavus (${waitingTime || 0} minutos)`
          : 'ℹ️ Conversa ainda está ativa',
      troubleshooting: !webhookConfigured && conversation.status === 'ended' && !conversation.transcriptReceived
        ? {
          problem: 'WEBHOOK_BASE_URL não configurado ou usando localhost',
          solution: 'Configure uma URL pública (ngrok/serveo) no .env',
          steps: [
            '1. Rode: ssh -R 80:localhost:3000 serveo.net',
            '2. Copie a URL gerada',
            '3. Atualize WEBHOOK_BASE_URL no .env',
            '4. Reinicie a API',
            '5. Crie uma nova conversa'
          ]
        }
        : null
    };
  }
}
