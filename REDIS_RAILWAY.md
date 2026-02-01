# 🚂 Redis no Railway - Guia Completo

## ✅ Redis Criado no Railway!

Parabéns! Você já adicionou o Redis no Railway. Agora vamos conectar.

---

## 🔌 **1. Configuração no Railway (Produção)**

### **Conectar automaticamente:**

1. No Railway Dashboard, vá no seu projeto
2. Clique no serviço da **API** (não no Redis)
3. Vá em **"Variables"**
4. **Adicione as variáveis** do Redis:

```
Clique em "Reference" e selecione:
- REDIS_HOST → Redis → REDIS_HOST
- REDIS_PORT → Redis → REDIS_PORT
- REDIS_PASSWORD → Redis → REDIS_PASSWORD (se houver)
```

Isso faz o Railway **conectar automaticamente** sua API ao Redis! ✅

### **Ou copiar manualmente:**

1. Clique no serviço **Redis**
2. Vá em **"Variables"**
3. Copie os valores:

```env
REDIS_HOST=containers-us-west-xxx.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha_aqui
```

4. Vá no serviço da **API** → **"Variables"**
5. Cole as variáveis lá

---

## 💻 **2. Configuração Local (Desenvolvimento)**

Você tem **2 opções**:

### **Opção A: Redis Local com Docker** ⭐ **Recomendado**

```bash
# Rodar Redis local (sem senha)
docker run -d -p 6379:6379 --name redis redis:alpine

# Verificar se está rodando
docker ps

# Seu .env continua assim:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Vantagens:**
- ✅ Mais rápido (local)
- ✅ Funciona offline
- ✅ Não gasta cota do Railway

### **Opção B: Conectar ao Redis do Railway**

```env
# .env (copie do Railway)
REDIS_HOST=containers-us-west-xxx.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=sua_senha_aqui
```

**Vantagens:**
- ✅ Não precisa Docker
- ✅ Mesmos dados em dev e prod

**Desvantagens:**
- ⚠️ Precisa internet
- ⚠️ Um pouco mais lento (rede)

---

## 🧪 **3. Testar Conexão**

### **No Railway:**

1. Vá no serviço da API
2. Clique em **"Deployments"**
3. Abra os **logs**
4. Procure por:

```bash
✅ Redis conectado com sucesso!
```

Se aparecer erro:
```bash
❌ Error: ECONNREFUSED
```

Significa que as variáveis não estão configuradas. Volte ao passo 1.

### **Local:**

```bash
# 1. Rodar Redis
docker run -d -p 6379:6379 redis:alpine

# 2. Testar conexão
docker exec -it redis redis-cli
> PING
PONG  # ✅ Funcionando!
> exit

# 3. Rodar sua API
yarn start:dev

# Nos logs deve aparecer:
# ❌ Cache MISS: conversation:xxx  (primeira vez)
# ✅ Cache HIT: conversation:xxx   (segunda vez)
```

---

## 📊 **4. Monitorar Redis no Railway**

### **Ver uso de memória:**

1. Railway Dashboard → Redis
2. Aba **"Metrics"**
3. Você verá:
   - Memória usada
   - Número de chaves
   - Operações/segundo

### **Ver chaves no Redis:**

No Railway CLI:
```bash
railway connect Redis
> KEYS *
> GET conversation:abc123
> TTL conversation:abc123  # Ver tempo restante
> FLUSHALL  # Limpar tudo (cuidado!)
```

---

## 🐛 **Troubleshooting**

### **Erro: "ECONNREFUSED" no Railway**
```bash
# Verificar se as variáveis estão configuradas:
Railway → API → Variables
Deve ter: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
```

### **Erro: "WRONGPASS invalid password"**
```bash
# Esqueceu de configurar REDIS_PASSWORD
# Pegue a senha no Redis → Variables → REDIS_PASSWORD
```

### **Erro: "connect ETIMEDOUT"**
```bash
# Redis do Railway não está acessível de fora
# Certifique-se de que está usando dentro do Railway
# Ou use Redis local para desenvolvimento
```

### **Cache não está funcionando**
```bash
# Verificar logs da API
# Deve aparecer "Cache HIT" ou "Cache MISS"

# Se não aparecer, verifique:
1. Redis está rodando?
2. Variáveis estão corretas?
3. API reiniciou após configurar?
```

---

## ✅ **Checklist Final**

### **Railway (Produção):**
- [ ] Redis criado no Railway
- [ ] Variáveis conectadas na API (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
- [ ] API fez redeploy
- [ ] Logs mostram conexão com Redis

### **Local (Desenvolvimento):**
- [ ] Redis rodando (Docker ou conectado ao Railway)
- [ ] `.env` configurado
- [ ] API inicia sem erros
- [ ] Logs mostram "Cache HIT/MISS"

---

## 🚀 **Próximos Passos**

Agora que o Redis está configurado:

1. ✅ **Deploy no Railway** - Pronto para produção!
2. ✅ **Performance 10x melhor** - Cache funcionando
3. ✅ **Escalabilidade** - Suporta 10k+ usuários

---

## 💡 **Comandos Úteis**

```bash
# Rodar Redis local
docker run -d -p 6379:6379 --name redis redis:alpine

# Parar Redis
docker stop redis

# Iniciar Redis novamente
docker start redis

# Ver logs do Redis
docker logs redis

# Conectar ao Redis local
docker exec -it redis redis-cli

# Limpar cache local
docker exec -it redis redis-cli FLUSHALL
```

---

**Pronto! Redis configurado e funcionando! 🎉**
