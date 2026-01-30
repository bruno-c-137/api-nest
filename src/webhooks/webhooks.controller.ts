import { Controller, Post, Body, HttpCode, Logger, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { TavusWebhookDto } from '../conversations/dto/tavus-webhook.dto';

// NOTA: Webhooks não usam JWT, a autenticação é feita via assinatura ou IP whitelist
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

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
