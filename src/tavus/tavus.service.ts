import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class TavusService {
  constructor(private readonly http: HttpService) {}

  async createConversation(params: {
    personaId: string;
    replicaId: string;
    language: string;
    conversationName?: string;
  }): Promise<{ conversationUrl: string; tavusConversationId?: string }> {
    const baseUrl = process.env.TAVUS_BASE_URL ?? 'https://tavusapi.com';
    const apiKey = process.env.TAVUS_API_KEY;
    if (!apiKey) throw new Error('Missing TAVUS_API_KEY');

    try {
      const res = await firstValueFrom(
        this.http.post(
          `${baseUrl}/v2/conversations`,
          {
            persona_id: params.personaId,
            replica_id: params.replicaId,
            conversation_name: params.conversationName ?? 'Conversation',
            properties: { language: params.language },
          },
          {
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Tavus retorna conversation_url; o id pode variar por versão
      return {
        conversationUrl: res.data?.conversation_url,
        tavusConversationId: res.data?.conversation_id ?? res.data?.id,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'Erro ao criar conversa';

        // Erro 402 - Sem créditos
        if (status === 402) {
          throw new HttpException(
            {
              statusCode: 402,
              message: 'Sua conta Tavus está sem créditos de conversação',
              details: 'Adicione créditos em https://platform.tavus.io/billing para continuar usando o serviço',
              originalError: message,
            },
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        // Erro 401 - API Key inválida
        if (status === 401) {
          throw new HttpException(
            {
              statusCode: 401,
              message: 'API Key da Tavus inválida ou expirada',
              details: 'Verifique sua API Key em https://platform.tavus.io/',
              originalError: message,
            },
            HttpStatus.UNAUTHORIZED,
          );
        }

        // Erro 400 - Bad Request
        if (status === 400) {
          throw new BadRequestException({
            message: 'Erro na requisição para Tavus',
            details: message,
          });
        }

        // Outros erros
        throw new HttpException(
          {
            statusCode: status,
            message: 'Erro ao comunicar com a API Tavus',
            details: message,
          },
          status,
        );
      }

      // Erro desconhecido
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Erro interno ao criar conversa',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
