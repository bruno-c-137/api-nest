# 🎣 Configuração de Webhooks Tavus

## 📋 Visão Geral

A API agora está configurada para receber webhooks automáticos da Tavus quando eventos importantes acontecem durante a conversa (como quando a transcrição fica disponível).

---

## 🚀 Como Funciona

```
1. Usuário → POST /conversations (criar conversa)
2. Backend → Tavus API (com callback_url configurado)
3. Usuário → Conversa no link Tavus
4. Conversa termina
5. Tavus → POST /webhooks/tavus (envia transcrição)
6. Backend → Salva mensagens automaticamente
7. GET /conversations/:id/messages → Mensagens disponíveis!
```

---

## ⚙️ Configuração

### 1. Configurar URL Pública (Desenvolvimento)

O Tavus precisa de uma URL pública para enviar webhooks. Use **ngrok**:

```bash
# Instalar ngrok (se ainda não tiver)
# https://ngrok.com/download

# Expor sua API local
ngrok http 3000
```

Você receberá uma URL tipo: `https://abc123.ngrok-free.app`

### 2. Atualizar `.env`

```env
WEBHOOK_BASE_URL="https://abc123.ngrok-free.app"
```

**IMPORTANTE**: Atualize sempre que reiniciar o ngrok (a URL muda)!

### 3. Reiniciar API

```bash
yarn start:dev
```

---

## 📡 Eventos Recebidos

O endpoint `POST /webhooks/tavus` processa os seguintes eventos:

| Evento | Descrição | Ação |
|--------|-----------|------|
| `system.replica_joined` | Réplica entrou na conversa | Log apenas |
| `system.shutdown` | Conversa encerrada | Atualiza status |
| `application.transcription_ready` | **Transcrição disponível** | **Salva mensagens** ✅ |
| `application.recording_ready` | Gravação disponível | Log apenas |

---

## 🧪 Testar

### Criar uma conversa:

```bash
curl -X POST http://localhost:3000/conversations \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "portuguese"
  }'
```

Resposta:
```json
{
  "conversationId": "uuid",
  "conversationUrl": "https://tavus.daily.co/xxxxx"
}
```

### Verificar logs do webhook:

Ao abrir `conversationUrl` e conversar:
- Tavus enviará webhooks para `https://abc123.ngrok-free.app/webhooks/tavus`
- Verifique logs no terminal: `Webhook Tavus recebido: ...`

### Verificar mensagens salvas:

```bash
curl http://localhost:3000/conversations/UUID/messages \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Webhook não está sendo recebido:

1. ✅ Verifique se ngrok está rodando
2. ✅ Verifique se `WEBHOOK_BASE_URL` está correto no `.env`
3. ✅ Reinicie a API após mudar `.env`
4. ✅ Verifique logs do ngrok: `ngrok http 3000` mostra requests recebidas

### Mensagens não estão sendo salvas:

1. ✅ Verifique logs da API: `Webhook Tavus recebido: ...`
2. ✅ Verifique se `conversation_id` no webhook corresponde a uma conversa no banco
3. ✅ Verifique se o evento é `application.transcription_ready`

### URL do ngrok expira:

```bash
# Parar ngrok: Ctrl+C
# Iniciar novamente
ngrok http 3000

# Copiar nova URL e atualizar .env
WEBHOOK_BASE_URL="https://NOVA_URL.ngrok-free.app"

# Reiniciar API
yarn start:dev
```

---

## 📝 Estrutura do Webhook

Exemplo de payload recebido da Tavus:

```json
{
  "type": "application.transcription_ready",
  "conversation_id": "ce1dbce416c6b4ba",
  "messages": [
    {
      "role": "user",
      "content": "Olá, como vai?",
      "id": "msg_123",
      "created_at": "2026-01-30T21:35:00Z"
    },
    {
      "role": "assistant",
      "content": "Oi! Estou bem, obrigado!",
      "id": "msg_124",
      "created_at": "2026-01-30T21:35:02Z"
    }
  ]
}
```

---

## 🚢 Produção

Em produção, substitua ngrok por:

1. **Domínio próprio**: `https://api.seusite.com`
2. Configure DNS corretamente
3. Use HTTPS (obrigatório)
4. Atualize `.env`:

```env
WEBHOOK_BASE_URL="https://api.seusite.com"
```

---

## 🔒 Segurança

⚠️ **IMPORTANTE**: O endpoint `/webhooks/tavus` **não usa JWT** (webhooks vêm de servidores externos).

Para produção, considere adicionar:

1. **Validação de assinatura**: Tavus pode enviar um header de autenticação
2. **IP Whitelist**: Permitir apenas IPs da Tavus
3. **Token secreto**: Configurar na Tavus e validar no backend

---

## 📚 Referências

- [Tavus Webhooks Documentation](https://docs.tavus.io/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
