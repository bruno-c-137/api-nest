# Integração Tavus - Guia de Configuração

## ✅ Implementação Completa

A integração com a API Tavus foi implementada com sucesso! Este documento explica como configurar e usar.

## 📋 O que foi implementado

### 1. **Módulo Tavus** (`src/tavus/`)
- `TavusService`: Serviço que encapsula chamadas à API Tavus
- `TavusModule`: Módulo configurado com HttpModule

### 2. **Endpoint de Iniciar Conversa**
- **Rota**: `POST /conversations/start`
- **DTO**: `StartConversationDto` com validações
- **Funcionalidades**:
  - Chama API Tavus para criar conversa
  - Salva registro no banco de dados PostgreSQL
  - Retorna `conversationId` e `conversationUrl` para o frontend

### 3. **Validação Global**
- `ValidationPipe` configurado no `main.ts`
- Propriedades: `whitelist`, `transform`, `forbidNonWhitelisted`

### 4. **Schema Prisma Atualizado**
Novos campos adicionados ao model `Conversation`:
- `tavusConversationId`: ID retornado pela Tavus
- `conversationUrl`: URL da conversa para o frontend

## 🚀 Como Configurar

### 1. Instalar Dependências

```bash
# Se você tiver problemas com a versão do Node, use:
nvm use 22.12  # ou outra versão compatível

# Instalar dependências
yarn install
```

### 2. Configurar Variáveis de Ambiente

Copie o `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/conversation_db"

# Server
PORT=3000

# Tavus API Configuration
TAVUS_API_KEY="sua_chave_api_tavus"
TAVUS_BASE_URL="https://tavusapi.com"
TAVUS_PERSONA_ID="seu_persona_id_padrao"
TAVUS_REPLICA_ID="seu_replica_id_padrao"
```

### 3. Criar Migration do Banco de Dados

```bash
# Criar e aplicar migration
npx prisma migrate dev --name add_tavus_fields

# Regenerar Prisma Client (caso necessário)
npx prisma generate
```

### 4. Recarregar o IDE

**IMPORTANTE**: Após rodar `prisma generate`, recarregue a janela do IDE:
- No Cursor/VSCode: `Ctrl+Shift+P` → Digite "Reload Window"
- Ou reinicie o TypeScript Server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### 5. Iniciar o Servidor

```bash
# Modo desenvolvimento
yarn start:dev

# Modo produção
yarn build
yarn start:prod
```

## 📡 Como Usar a API

### Iniciar Nova Conversa

**Endpoint**: `POST http://localhost:3000/conversations/start`

**Request Body**:
```json
{
  "language": "portuguese",
  "personaId": "opcional_sobrescreve_env",
  "replicaId": "opcional_sobrescreve_env"
}
```

**Campos**:
- `language` (obrigatório): Nome completo do idioma ("portuguese", "english", "spanish", etc.)
- `personaId` (opcional): Sobrescreve `TAVUS_PERSONA_ID` do .env
- `replicaId` (opcional): Sobrescreve `TAVUS_REPLICA_ID` do .env

**Response de Sucesso** (200):
```json
{
  "conversationId": "uuid-da-conversa-no-banco",
  "conversationUrl": "https://tavus.io/conversations/xyz123"
}
```

**Response de Erro** (400):
```json
{
  "statusCode": 400,
  "message": "O idioma é obrigatório",
  "error": "Bad Request"
}
```

### Exemplos de Requisição

#### cURL
```bash
curl -X POST http://localhost:3000/conversations/start \
  -H "Content-Type: application/json" \
  -d '{"language": "portuguese"}'
```

#### JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3000/conversations/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    language: 'portuguese'
  })
});

const data = await response.json();
console.log('Conversation URL:', data.conversationUrl);
```

#### Axios
```javascript
import axios from 'axios';

const { data } = await axios.post('http://localhost:3000/conversations/start', {
  language: 'portuguese'
});

console.log('Conversation ID:', data.conversationId);
console.log('Conversation URL:', data.conversationUrl);
```

## 🔍 Detalhes Técnicos

### Fluxo de Execução

1. **Controller** (`conversations.controller.ts`) recebe o request
2. **DTO** (`StartConversationDto`) valida os dados
3. **Service** (`conversations.service.ts`):
   - Valida variáveis de ambiente
   - Chama `TavusService.createConversation()`
   - Salva registro no banco via Prisma
   - Retorna `conversationId` e `conversationUrl`
4. **TavusService** (`tavus.service.ts`):
   - Faz POST para `https://tavusapi.com/v2/conversations`
   - Headers: `Authorization: Bearer <TAVUS_API_KEY>`
   - Body: `{ persona_id, replica_id, properties: { language } }`
   - Retorna `conversation_url` e `conversation_id`

### userId Demo

Para o MVP, o sistema usa um userId fixo: `"demo-user-id"`

**Para implementar autenticação real:**
1. Adicione um guard de autenticação (JWT, Passport, etc.)
2. Extraia o userId do token/sessão
3. Substitua `'demo-user-id'` por `req.user.id` no service

### Tratamento de Erros

O sistema valida:
- ✅ Campo `language` obrigatório
- ✅ Variáveis de ambiente (`TAVUS_API_KEY`, `TAVUS_PERSONA_ID`, `TAVUS_REPLICA_ID`)
- ✅ Resposta da API Tavus (`conversation_url` presente)
- ✅ Erros HTTP da Tavus (propagados como exceções NestJS)

## 🗄️ Modelo de Dados

### Conversation (Prisma Schema)

```prisma
model Conversation {
  id                  String    @id @default(uuid())
  userId              String
  tavusReplicaId      String?
  tavusSessionId      String?
  tavusConversationId String?   // ← NOVO
  conversationUrl     String?   // ← NOVO
  language            String
  status              String
  startedAt           DateTime?
  endedAt             DateTime?
  durationSeconds     Int?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  user     User      @relation(...)
  messages Message[]
}
```

## 📦 Dependências Adicionadas

- `class-validator`: Validação de DTOs
- `class-transformer`: Transformação de dados
- `@nestjs/axios`: Cliente HTTP para chamar APIs externas
- `axios`: Biblioteca HTTP (peer dependency)

## 🧪 Testando

### Teste Manual

1. Inicie o servidor: `yarn start:dev`
2. Use um cliente HTTP (Postman, Insomnia, curl)
3. Faça POST para `http://localhost:3000/conversations/start`
4. Verifique a resposta com `conversationUrl`

### Teste no Frontend

```typescript
// Exemplo React
const startConversation = async () => {
  const { conversationId, conversationUrl } = await fetch(
    'http://localhost:3000/conversations/start',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'portuguese' })
    }
  ).then(r => r.json());

  // Redirecionar usuário para a URL da Tavus
  window.location.href = conversationUrl;
};
```

## 🐛 Resolução de Problemas

### Erros TypeScript no IDE

Se você vir erros como "Property 'conversationUrl' does not exist":

1. Execute: `npx prisma generate`
2. Recarregue o IDE: `Ctrl+Shift+P` → "Reload Window"
3. Ou reinicie: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Erro: "Missing TAVUS_API_KEY"

Verifique se o arquivo `.env` existe e contém `TAVUS_API_KEY=...`

### Erro: "personaId não fornecido e TAVUS_PERSONA_ID não está definido"

Você precisa:
- Definir `TAVUS_PERSONA_ID` no `.env`, OU
- Passar `personaId` no body da requisição

### Erro de Conexão com Banco

1. Verifique se o PostgreSQL está rodando
2. Confirme a `DATABASE_URL` no `.env`
3. Execute: `npx prisma migrate dev`

## 📝 Próximos Passos

- [ ] Implementar autenticação real (substituir `demo-user-id`)
- [ ] Adicionar testes unitários e E2E
- [ ] Implementar webhook da Tavus para receber eventos
- [ ] Adicionar logs estruturados
- [ ] Implementar rate limiting
- [ ] Adicionar monitoramento (Sentry, New Relic, etc.)

## 🤝 Suporte

Se precisar de ajuda, verifique:
- Documentação Tavus: https://docs.tavus.io
- Documentação NestJS: https://docs.nestjs.com
- Documentação Prisma: https://www.prisma.io/docs

---

**Status**: ✅ Implementação completa e funcional
**Versão**: 1.0.0
**Data**: Janeiro 2026
