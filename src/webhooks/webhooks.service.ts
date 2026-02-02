import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) { }

  async processTavusWebhook(data: any) {
    this.logger.log(`📥 Webhook recebido: ${data.event_type || data.type}`);

    // Validação rápida e busca de conversa
    const tavusConversationId = data.conversation_id || data.conversation?.conversation_id;

    if (!tavusConversationId) {
      this.logger.warn('⚠️  Webhook sem conversation_id, ignorando');
      return { status: 'ignored', reason: 'missing_conversation_id' };
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: { tavusConversationId },
    });

    if (!conversation) {
      this.logger.warn(`⚠️  Conversa não encontrada: ${tavusConversationId}`);
      return { status: 'ignored', reason: 'conversation_not_found' };
    }

    const eventType = data.type || data.event_type;
    this.logger.log(`✅ Processando evento "${eventType}" para conversa ${conversation.id}`);

    // 🚀 OTIMIZAÇÃO: Processar em background (não bloquear webhook)
    // Responder 200 OK imediatamente para a Tavus
    setImmediate(() => {
      this.processWebhookAsync(conversation.id, eventType, data).catch((error) => {
        this.logger.error(`❌ Erro no processamento assíncrono:`, error);
      });
    });

    return {
      status: 'processing',
      conversationId: conversation.id,
      eventType
    };
  }

  /**
   * Processa o webhook em background (não bloqueia a resposta HTTP)
   */
  private async processWebhookAsync(conversationId: string, eventType: string, data: any) {
    try {
      switch (eventType) {
        case 'system.replica_joined':
          this.logger.log(`🤖 Réplica entrou na conversa ${conversationId}`);
          break;

        case 'system.shutdown':
          await this.handleConversationEnded(conversationId, data);
          break;

        case 'application.transcription_ready':
          await this.handleTranscriptAvailable(conversationId, data);
          break;

        case 'application.recording_ready':
          this.logger.log(`🎥 Gravação disponível para conversa ${conversationId}`);
          // TODO: Implementar download/salvamento de gravação se necessário
          break;

        // Compatibilidade com nomes alternativos
        case 'conversation.ended':
        case 'conversation_ended':
          await this.handleConversationEnded(conversationId, data);
          break;

        case 'transcript.available':
        case 'transcript_available':
          await this.handleTranscriptAvailable(conversationId, data);
          break;

        default:
          this.logger.log(`ℹ️  Tipo de evento não tratado: ${eventType}`);
      }

      this.logger.log(`✅ Evento "${eventType}" processado com sucesso para conversa ${conversationId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao processar evento "${eventType}":`, error);
      throw error;
    }
  }

  private async handleConversationEnded(conversationId: string, data: any) {
    this.logger.log(`🔚 Encerrando conversa ${conversationId}`);

    // Atualizar status se ainda não estiver ended
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (conversation && conversation.status !== 'ended') {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      });
      this.logger.log(`✅ Status atualizado para "ended"`);
    }

    // Se vier transcrição junto, processar
    if (data.transcript || data.messages || data.properties?.transcript) {
      this.logger.log(`📝 Transcrição detectada no evento de encerramento`);
      await this.handleTranscriptAvailable(conversationId, data);
    }
  }

  private async handleTranscriptAvailable(conversationId: string, data: any) {
    this.logger.log(`💾 Processando transcrição para conversa ${conversationId}`);
    const startTime = Date.now();

    // Extrair mensagens do webhook
    const messages = this.extractMessages(data);

    if (messages.length === 0) {
      this.logger.warn('⚠️  Nenhuma mensagem encontrada no webhook');
      return;
    }

    this.logger.log(`📨 ${messages.length} mensagens encontradas`);

    // Salvar mensagens (agora otimizado com bulk insert)
    try {
      const result = await this.conversationsService.saveTranscript(conversationId, messages);

      const elapsed = Date.now() - startTime;
      this.logger.log(`✅ Transcrição salva em ${elapsed}ms: ${result.savedCount} novas, ${result.skippedCount} duplicadas`);

      // Marcar que a transcrição foi recebida via webhook
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { transcriptReceived: true },
      });

      this.logger.log(`✅ Marcado transcriptReceived=true para conversa ${conversationId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar transcrição:`, error);
      throw error;
    }
  }

  private extractMessages(data: any): Array<{
    role: 'user' | 'assistant';
    content: string;
    externalEventId?: string;
    createdAt?: string;
  }> {
    const messages: any[] = [];

    // Tentar extrair de diferentes formatos possíveis
    if (Array.isArray(data.messages)) {
      messages.push(...data.messages);
    } else if (Array.isArray(data.properties?.transcript)) {
      // ✅ Formato real da Tavus: properties.transcript[]
      messages.push(...data.properties.transcript);
    } else if (Array.isArray(data.transcript?.messages)) {
      messages.push(...data.transcript.messages);
    } else if (Array.isArray(data.transcript)) {
      messages.push(...data.transcript);
    }

    // Converter para formato interno
    // Filtrar mensagens de sistema (role: "system")
    return messages
      .filter((msg: any) => {
        const role = msg.role || msg.speaker || msg.type;
        return role !== 'system'; // Ignora mensagens de sistema
      })
      .map((msg: any) => ({
        role: this.determineRole(msg),
        content: msg.content || msg.text || msg.message || '',
        externalEventId: msg.id || msg.event_id || msg.message_id,
        createdAt: msg.created_at || msg.timestamp || msg.createdAt,
      }))
      .filter(msg => msg.content); // Remove mensagens vazias
  }

  private determineRole(msg: any): 'user' | 'assistant' {
    const role = msg.role || msg.speaker || msg.type;

    if (role === 'user' || role === 'customer' || role === 'human') {
      return 'user';
    }

    return 'assistant';
  }
}
