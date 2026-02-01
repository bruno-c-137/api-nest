import { Controller, Post, Body, HttpCode, Logger, Get } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

// NOTA: Webhooks não usam JWT, a autenticação é feita via assinatura ou IP whitelist
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Health check para verificar se webhook está acessível
   * GET /webhooks/health
   */
  @Get('health')
  @HttpCode(200)
  async healthCheck() {
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    const isLocalhost = webhookBaseUrl.includes('localhost') || webhookBaseUrl.includes('127.0.0.1');
    
    return {
      status: 'ok',
      service: 'webhooks',
      message: 'Webhook endpoint está funcionando',
      webhookUrl: `${webhookBaseUrl}/webhooks/tavus`,
      isPublic: !isLocalhost,
      warning: isLocalhost ? 'URL usando localhost - Tavus não conseguirá acessar!' : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint para receber webhooks da Tavus
   * POST /webhooks/tavus
   * 
   * Configure este URL no painel da Tavus:
   * https://seu-dominio.com/webhooks/tavus
   */
  @Post('tavus')
  @HttpCode(200)
  async handleTavusWebhook(@Body() data: any) {
    this.logger.log('Webhook Tavus recebido:', JSON.stringify(data, null, 2));

    try {
      await this.webhooksService.processTavusWebhook(data);
      return { success: true, message: 'Webhook processado com sucesso' };
    } catch (error) {
      this.logger.error('Erro ao processar webhook:', error);
      // Retorna 200 mesmo com erro para não reenviar o webhook
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }
}
