# Changelog - Integração Tavus API

## 📝 Resumo das Mudanças

Esta documentação lista todas as mudanças feitas para implementar a integração com a API Tavus CVI (Conversational Video Interface).

---

## ✨ Arquivos Criados

### 1. `src/tavus/tavus.module.ts`
**Status**: ✅ Já existia (criado pelo usuário)
- Importa `HttpModule` do `@nestjs/axios`
- Exporta `TavusService`

### 2. `src/tavus/tavus.service.ts`
**Status**: ✅ Já existia (criado pelo usuário)
- Método `createConversation()` que chama API Tavus
- Usa `firstValueFrom` para converter Observable em Promise
- Valida `TAVUS_API_KEY`
- Retorna `conversationUrl` e `tavusConversationId`

### 3. `src/conversations/dto/start-conversation.dto.ts`
**Status**: ✅ Criado
- DTO com validações usando `class-validator`
- Campos:
  - `language` (obrigatório)
  - `personaId` (opcional)
  - `replicaId` (opcional)

### 4. `TAVUS_SETUP.md`
**Status**: ✅ Criado
- Documentação completa de configuração
- Exemplos de uso da API
- Guia de troubleshooting

### 5. `CHANGELOG_TAVUS.md`
**Status**: ✅ Criado (este arquivo)

---

## 🔄 Arquivos Modificados

### 1. `prisma/schema.prisma`
**Mudanças**:
```diff
model Conversation {
  id                  String    @id @default(uuid())
  userId              String
  tavusReplicaId      String?
  tavusSessionId      String?
+ tavusConversationId String?
+ conversationUrl     String?
  language            String
  status              String
  ...
}
```

**Motivo**: Armazenar dados retornados pela API Tavus

---

### 2. `src/main.ts`
**Mudanças**:
```diff
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
- await app.listen(process.env.PORT ?? 3000);
- app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
+ // Configurar ValidationPipe global antes de iniciar o servidor
+ app.useGlobalPipes(
+   new ValidationPipe({
+     whitelist: true,
+     transform: true,
+     forbidNonWhitelisted: true,
+   }),
+ );
+ 
+ await app.listen(process.env.PORT ?? 3000);
+ console.log(`🚀 Servidor rodando na porta ${process.env.PORT ?? 3000}`);
}
```

**Motivo**: 
- ValidationPipe deve ser configurado ANTES do `listen()`
- Adicionado `forbidNonWhitelisted` para maior segurança
- Log de inicialização

---

### 3. `src/conversations/conversations.module.ts`
**Mudanças**:
```diff
import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
+import { TavusModule } from '../tavus/tavus.module';

@Module({
+ imports: [TavusModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
```

**Motivo**: Permitir que `ConversationsService` use `TavusService`

---

### 4. `src/conversations/conversations.service.ts`
**Mudanças**:
```diff
-import { Injectable, NotFoundException } from '@nestjs/common';
+import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
+import { TavusService } from '../tavus/tavus.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
+   private readonly tavusService: TavusService,
  ) {}

+ /**
+  * Inicia uma nova conversa na Tavus e salva no banco de dados
+  */
+ async startConversation(params: {
+   language: string;
+   personaId?: string;
+   replicaId?: string;
+ }) {
+   // Validar variáveis de ambiente
+   const defaultPersonaId = process.env.TAVUS_PERSONA_ID;
+   const defaultReplicaId = process.env.TAVUS_REPLICA_ID;
+
+   const personaId = params.personaId || defaultPersonaId;
+   const replicaId = params.replicaId || defaultReplicaId;
+
+   if (!personaId) {
+     throw new BadRequestException(
+       'personaId não fornecido e TAVUS_PERSONA_ID não está definido no ambiente',
+     );
+   }
+
+   if (!replicaId) {
+     throw new BadRequestException(
+       'replicaId não fornecido e TAVUS_REPLICA_ID não está definido no ambiente',
+     );
+   }
+
+   // Chamar Tavus API
+   const { conversationUrl, tavusConversationId } =
+     await this.tavusService.createConversation({
+       personaId,
+       replicaId,
+       language: params.language,
+     });
+
+   if (!conversationUrl) {
+     throw new BadRequestException('Tavus não retornou conversation_url');
+   }
+
+   // Salvar no banco (MVP: userId fixo "demo-user-id")
+   const conversation = await this.prisma.conversation.create({
+     data: {
+       userId: 'demo-user-id',
+       language: params.language,
+       status: 'active',
+       conversationUrl,
+       tavusConversationId,
+       tavusReplicaId: replicaId,
+       startedAt: new Date(),
+     },
+   });
+
+   return {
+     conversationId: conversation.id,
+     conversationUrl: conversation.conversationUrl,
+   };
+ }
}
```

**Motivo**: Implementar lógica de integração com Tavus

---

### 5. `src/conversations/conversations.controller.ts`
**Mudanças**:
```diff
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
+import { StartConversationDto } from './dto/start-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

+ /**
+  * Inicia uma nova conversa com avatar Tavus
+  * POST /conversations/start
+  */
+ @Post('start')
+ async startConversation(@Body() dto: StartConversationDto) {
+   return this.conversationsService.startConversation({
+     language: dto.language,
+     personaId: dto.personaId,
+     replicaId: dto.replicaId,
+   });
+ }

  @Post()
  async create(@Body() data: { userId: string; language: string; tavusReplicaId?: string }) {
    return this.conversationsService.create(data);
  }
  ...
}
```

**Motivo**: Criar endpoint `POST /conversations/start`

---

### 6. `package.json`
**Mudanças**:
```diff
"dependencies": {
  "@nestjs/axios": "^4.0.1",
  "@nestjs/common": "^11.0.1",
  ...
+ "class-transformer": "^0.5.1",
+ "class-validator": "^0.14.1",
  "dotenv": "^16.4.5",
  ...
}
```

**Motivo**: Adicionar dependências para validação de DTOs

---

### 7. `.env.example`
**Mudanças**:
```diff
+# Database
DATABASE_URL="postgresql://user:password@localhost:5432/conversation_db"

+# Server
+PORT=3000
+
+# Tavus API Configuration
+TAVUS_API_KEY="your_tavus_api_key_here"
+TAVUS_BASE_URL="https://tavusapi.com"
+TAVUS_PERSONA_ID="your_default_persona_id"
+TAVUS_REPLICA_ID="your_default_replica_id"
```

**Motivo**: Documentar variáveis de ambiente necessárias

---

## 🔧 Comandos Executados

```bash
# 1. Adicionar dependências ao package.json (manual)
# class-validator e class-transformer

# 2. Regenerar Prisma Client
npx prisma generate

# 3. Criar migration (pendente - devido a restrições de sandbox)
# Você deve executar:
npx prisma migrate dev --name add_tavus_fields_to_conversation
```

---

## ⚠️ Ações Pendentes

### 1. **Instalar Dependências**
```bash
# Verificar versão do Node (precisa ser ^20.19 || ^22.12 || >=24.0)
node --version

# Se necessário, usar nvm
nvm install 22.12
nvm use 22.12

# Instalar dependências
yarn install
```

### 2. **Criar Migration do Banco**
```bash
npx prisma migrate dev --name add_tavus_fields_to_conversation
```

### 3. **Recarregar IDE**
Após executar `prisma generate`:
- Pressione `Ctrl+Shift+P`
- Digite: "Reload Window" ou "TypeScript: Restart TS Server"

Isso resolverá os erros TypeScript relacionados aos novos campos do Prisma.

### 4. **Configurar .env**
```bash
cp .env.example .env
# Editar .env com suas credenciais reais da Tavus
```

### 5. **Testar o Endpoint**
```bash
# Iniciar servidor
yarn start:dev

# Em outro terminal, testar
curl -X POST http://localhost:3000/conversations/start \
  -H "Content-Type: application/json" \
  -d '{"language": "portuguese"}'
```

---

## 📊 Status de Implementação

| Item | Status | Descrição |
|------|--------|-----------|
| TavusModule | ✅ | Módulo criado com HttpModule |
| TavusService | ✅ | Serviço que chama API Tavus |
| StartConversationDto | ✅ | DTO com validações |
| POST /conversations/start | ✅ | Endpoint implementado |
| ValidationPipe global | ✅ | Configurado corretamente |
| Schema Prisma | ✅ | Campos adicionados |
| Documentação | ✅ | TAVUS_SETUP.md criado |
| Dependências | ⚠️ | Adicionadas, mas não instaladas (problema Node) |
| Migration | ⚠️ | Pendente (comando falhou) |
| Teste E2E | ⏳ | Aguardando configuração completa |

---

## 🎯 Arquitetura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│    POST /conversations/start { language: "portuguese" }     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ConversationsController                     │
│                  @Post('start')                              │
│                  - Recebe StartConversationDto               │
│                  - Valida com class-validator                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ConversationsService                        │
│                  startConversation()                         │
│                  - Valida env vars                           │
│                  - Chama TavusService                        │
│                  - Salva no Prisma                           │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
            ▼                            ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│    TavusService      │    │      PrismaService          │
│  createConversation()│    │  conversation.create()      │
│  - POST Tavus API    │    │  - Insert PostgreSQL        │
│  - Return URL + ID   │    │  - Return conversation      │
└──────────────────────┘    └─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│              Tavus API (External)                            │
│    POST https://tavusapi.com/v2/conversations               │
│    { persona_id, replica_id, properties: { language } }     │
│    Returns: { conversation_url, conversation_id }           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

- ✅ Validação de entrada com DTOs
- ✅ Whitelist de propriedades (`forbidNonWhitelisted`)
- ✅ API Key armazenada em variável de ambiente
- ⚠️ Autenticação: Usando userId fixo (MVP) - **implementar JWT**
- ⚠️ Rate Limiting: Não implementado - **adicionar Guard**
- ⚠️ CORS: Configuração padrão - **revisar para produção**

---

## 📚 Referências

- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Tavus API Docs](https://docs.tavus.io)
- [@nestjs/axios](https://docs.nestjs.com/techniques/http-module)

---

**Data de Implementação**: 30 de Janeiro de 2026  
**Versão**: 1.0.0  
**Status**: ✅ Implementação completa, pendente instalação e testes
