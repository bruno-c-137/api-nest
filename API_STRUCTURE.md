# Estrutura da API - SaaS Multi-tenant Tavus

## Estrutura de Diretórios

```
src/
├── prisma/              # Serviço global do Prisma
├── organizations/       # Gerenciamento de organizações (tenants)
├── users/              # Gerenciamento de usuários
├── conversations/      # Conversas com avatar Tavus
├── messages/           # Mensagens das conversas
├── subscriptions/      # Assinaturas das organizações
├── plans/             # Planos disponíveis
└── app.module.ts      # Módulo principal
```

## Endpoints Criados

### Organizations (`/organizations`)
- `POST /organizations` - Criar organização
- `GET /organizations` - Listar organizações (paginado)
- `GET /organizations/:id` - Buscar organização por ID
- `PUT /organizations/:id` - Atualizar organização
- `DELETE /organizations/:id` - Remover organização
- `GET /organizations/:id/members` - Listar membros
- `GET /organizations/:id/usage` - Obter uso (para billing)

### Users (`/users`)
- `POST /users` - Criar usuário
- `GET /users` - Listar usuários (paginado)
- `GET /users/:id` - Buscar usuário por ID
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Remover usuário
- `GET /users/:id/organizations` - Listar organizações do usuário

### Conversations (`/conversations`)
- `POST /conversations` - Criar conversa
- `GET /conversations` - Listar conversas (paginado, filtros por org/status)
- `GET /conversations/:id` - Buscar conversa por ID
- `PUT /conversations/:id/start` - Iniciar conversa (define tavusSessionId)
- `PUT /conversations/:id/end` - Finalizar conversa (calcula duração)
- `DELETE /conversations/:id` - Remover conversa
- `GET /conversations/:id/messages` - Listar mensagens
- `GET /conversations/:id/events` - Listar eventos de telemetria

### Messages (`/messages`)
- `POST /messages` - Criar mensagem
- `GET /messages/conversation/:conversationId` - Listar mensagens da conversa
- `GET /messages/:id` - Buscar mensagem por ID
- `DELETE /messages/:id` - Remover mensagem

### Subscriptions (`/subscriptions`)
- `POST /subscriptions` - Criar assinatura
- `GET /subscriptions/organization/:organizationId` - Buscar assinatura da org
- `GET /subscriptions/:id` - Buscar assinatura por ID
- `PUT /subscriptions/:id` - Atualizar assinatura
- `PUT /subscriptions/:id/cancel` - Cancelar assinatura
- `DELETE /subscriptions/:id` - Remover assinatura

### Plans (`/plans`)
- `POST /plans` - Criar plano
- `GET /plans` - Listar todos os planos
- `GET /plans/active` - Listar planos ativos
- `GET /plans/:id` - Buscar plano por ID
- `PUT /plans/:id` - Atualizar plano
- `DELETE /plans/:id` - Remover plano

## Funcionalidades Implementadas

### Multi-tenancy
- Isolamento por `organizationId` em todas as queries de conversas
- Memberships com roles para controle de acesso
- Um usuário pode pertencer a múltiplas organizações

### Billing & Usage
- Tracking diário de uso (`UsageDaily`)
- Controle de limites por plano
- Integração preparada para Stripe

### Conversas Tavus
- Gerenciamento completo do ciclo de vida (pending → active → completed)
- Cálculo automático de duração
- Armazenamento de metadata customizada
- Telemetria com `ConversationEvent`

### Segurança
- Senhas hasheadas com bcrypt
- Soft deletes onde apropriado (cascade configurado no Prisma)
- Validações de conflito (email, slug únicos)

## Próximos Passos Sugeridos

1. **Autenticação**: Implementar JWT/Passport para auth real
2. **Guards**: Criar guards para proteção de rotas por role
3. **Validação**: Adicionar class-validator nos DTOs
4. **Middleware**: Tenant context middleware
5. **WebSockets**: Real-time para mensagens das conversas
6. **Tavus SDK**: Integrar SDK real do Tavus
7. **Stripe**: Webhooks para eventos de pagamento
8. **Testes**: Unit e E2E tests
