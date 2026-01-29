# API Conversation

API MVP para conversas por voz com avatar em vídeo usando Tavus (CVI).

## Stack

- **Backend**: NestJS
- **ORM**: Prisma
- **Banco de dados**: PostgreSQL

## Instalação

```bash
npm install
```

## Configuração

Configure o arquivo `.env` com a conexão do banco:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/conversation_db"
```

## Migrations

```bash
# Criar nova migration
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate
```

## Executar

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run start:prod
```

## API Endpoints

### Users

- `POST /users` - Criar usuário
- `GET /users` - Listar usuários (paginado)
- `GET /users/:id` - Obter usuário
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Remover usuário
- `GET /users/:id/conversations` - Conversas do usuário

### Conversations

- `POST /conversations` - Criar conversa
- `GET /conversations` - Listar conversas (paginado)
- `GET /conversations/:id` - Obter conversa
- `PUT /conversations/:id/start` - Iniciar conversa
- `PUT /conversations/:id/end` - Finalizar conversa
- `DELETE /conversations/:id` - Remover conversa
- `GET /conversations/:id/messages` - Mensagens da conversa

### Messages

- `POST /messages` - Criar mensagem
- `GET /messages/conversation/:conversationId` - Mensagens por conversa
- `GET /messages/:id` - Obter mensagem
- `DELETE /messages/:id` - Remover mensagem
