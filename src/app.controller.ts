import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Endpoint de teste para verificar se Redis está salvando
  @Get('test-redis')
  async testRedis() {
    const testKey = 'test:redis:connection';
    const testValue = {
      message: 'Redis funcionando!',
      timestamp: new Date().toISOString(),
      host: process.env.REDIS_HOST,
    };

    try {
      // Salvar SEM TTL (permanente)
      await this.redis.set(testKey, testValue, 0);

      // Tentar recuperar
      const retrieved = await this.redis.get(testKey);

      return {
        success: true,
        message: 'Redis funcionando!',
        saved: testValue,
        retrieved: retrieved,
        instructions:
          'Vá no Railway → Redis → Data e procure pela chave: test:redis:connection',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Endpoint para salvar direto no Redis (sem cache-manager)
  @Get('redis-direct-save')
  async redisDirectSave() {
    const testKey = 'direct:test:permanent';
    const testValue = {
      message: 'Salvo DIRETAMENTE no Redis via RedisService',
      timestamp: new Date().toISOString(),
    };

    try {
      // Salvar SEM expiração
      await this.redis.set(testKey, testValue, 0);

      // Recuperar para confirmar
      const retrieved = await this.redis.get(testKey);

      return {
        success: true,
        key: testKey,
        saved: testValue,
        retrieved: retrieved,
        message: 'Chave salva diretamente no Redis! Agora vá em Railway → Redis → Data',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Endpoint para listar todas as chaves no Redis
  @Get('redis-keys')
  async listRedisKeys() {
    try {
      // Listar todas as chaves
      const keys = await this.redis.keys('*');

      return {
        success: true,
        totalKeys: keys.length,
        keys: keys,
        message:
          keys.length > 0
            ? 'Chaves encontradas no Redis!'
            : 'Nenhuma chave encontrada (ou já expiraram)',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
