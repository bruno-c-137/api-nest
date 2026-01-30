// DTO flexível para webhooks da Tavus
// Aceita qualquer estrutura de dados
export class TavusWebhookDto {
  // Aceita qualquer campo sem validação estrita
  [key: string]: any;
}
