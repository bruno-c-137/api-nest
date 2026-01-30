# 📋 Comandos de Migration

## ⚠️ **Ação Necessária:**

Execute este comando para adicionar o campo `transcriptReceived`:

```bash
yarn prisma migrate dev --name add_transcript_received
```

## ✅ **O que isso faz:**

- Adiciona campo `transcriptReceived` (boolean, default: false)
- Permite rastrear se o webhook da Tavus foi recebido
- Melhora o feedback sobre status da transcrição

---

## 🧪 **Após a Migration:**

Reinicie a API:

```bash
yarn start:dev
```

---

## 📊 **Novos Recursos:**

### **1. Campo no banco:**
- `transcriptReceived`: indica se webhook chegou

### **2. Endpoint `/end` melhorado:**
```json
{
  "status": "ended",
  "transcriptReceived": false,
  "webhookStatus": "Aguardando webhook da Tavus (2-5 minutos)"
}
```

### **3. Novo endpoint `/webhook-status`:**
```bash
GET /conversations/:id/webhook-status

Response:
{
  "conversationId": "...",
  "status": "ended",
  "transcriptReceived": true,
  "messagesCount": 5,
  "message": "✅ Webhook recebido! Transcrição disponível."
}
```

---

## 🎯 **Como Usar:**

```bash
# 1. Criar conversa
POST /conversations

# 2. Conversar

# 3. Encerrar
POST /conversations/:id/end
# Retorna: webhookStatus: "Aguardando webhook..."

# 4. Verificar status
GET /conversations/:id/webhook-status
# Retorna: transcriptReceived: false/true
```
