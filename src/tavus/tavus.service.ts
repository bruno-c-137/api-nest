import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

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
  }
}
