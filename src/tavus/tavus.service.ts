import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class TavusService {
    constructor(private readonly http: HttpService) { }

    async createConversation(params: {
        personaId: string;
        replicaId: string;
        language: string;
        conversationName?: string;
        callbackUrl?: string;
    }): Promise<{ conversationUrl: string; tavusConversationId?: string }> {
        const baseUrl = process.env.TAVUS_BASE_URL ?? 'https://tavusapi.com';
        const apiKey = process.env.TAVUS_API_KEY;
        if (!apiKey) throw new Error('Missing TAVUS_API_KEY');

        try {
            const requestBody: any = {
                persona_id: params.personaId,
                replica_id: params.replicaId,
                conversation_name: params.conversationName ?? 'Conversation',
                properties: { language: params.language },
            };

            // Adicionar callback_url se fornecido
            if (params.callbackUrl) {
                requestBody.callback_url = params.callbackUrl;
            }

            const res = await firstValueFrom(
                this.http.post(
                    `${baseUrl}/v2/conversations`,
                    requestBody,
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

    async getConversation(conversationId: string): Promise<any> {
        const baseUrl = process.env.TAVUS_BASE_URL ?? 'https://tavusapi.com';
        const apiKey = process.env.TAVUS_API_KEY;
        if (!apiKey) throw new Error('Missing TAVUS_API_KEY');

        try {
            const res = await firstValueFrom(
                this.http.get(`${baseUrl}/v2/conversations/${conversationId}`, {
                    headers: {
                        'x-api-key': apiKey,
                    },
                }),
            );

            return res.data;
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Erro ao buscar conversa';

                throw new HttpException(
                    {
                        statusCode: status,
                        message: 'Erro ao buscar conversa na Tavus',
                        details: message,
                    },
                    status,
                );
            }

            throw new HttpException(
                {
                    statusCode: 500,
                    message: 'Erro ao buscar conversa',
                    details: error instanceof Error ? error.message : 'Erro desconhecido',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getConversationTranscript(conversationId: string): Promise<any> {
        const baseUrl = process.env.TAVUS_BASE_URL ?? 'https://tavusapi.com';
        const apiKey = process.env.TAVUS_API_KEY;
        if (!apiKey) throw new Error('Missing TAVUS_API_KEY');

        try {
            // Tenta buscar transcript (o endpoint pode variar)
            const res = await firstValueFrom(
                this.http.get(`${baseUrl}/v2/conversations/${conversationId}/transcript`, {
                    headers: {
                        'x-api-key': apiKey,
                    },
                }),
            );

            return res.data;
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Erro ao buscar transcrição';

                // Se 404, pode ser que a conversa não tenha transcrição ainda
                if (status === 404) {
                    throw new HttpException(
                        {
                            statusCode: 404,
                            message: 'Transcrição não encontrada',
                            details: 'A conversa pode ainda não ter transcrição disponível ou ainda está em andamento',
                        },
                        HttpStatus.NOT_FOUND,
                    );
                }

                throw new HttpException(
                    {
                        statusCode: status,
                        message: 'Erro ao buscar transcrição na Tavus',
                        details: message,
                    },
                    status,
                );
            }

            throw new HttpException(
                {
                    statusCode: 500,
                    message: 'Erro ao buscar transcrição',
                    details: error instanceof Error ? error.message : 'Erro desconhecido',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
