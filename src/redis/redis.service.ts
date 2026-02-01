import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  async onModuleInit() {
    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔌 Redis Client conectando...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client pronto!');
        this.isConnected = true;
      });

      await this.client.connect();
      console.log(`✅ Redis conectado em ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
    } catch (error) {
      console.error('❌ Erro ao conectar no Redis:', error.message);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      console.log('👋 Redis desconectado');
    }
  }

  /**
   * Salvar valor no Redis
   * @param key Chave
   * @param value Valor (será convertido para JSON se for objeto)
   * @param ttlSeconds TTL em segundos (opcional, 0 = sem expiração)
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️  Redis não conectado, ignorando set()');
      return;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.setEx(key, ttlSeconds, stringValue);
        console.log(`💾 Redis SET: ${key} (TTL: ${ttlSeconds}s)`);
      } else {
        await this.client.set(key, stringValue);
        console.log(`💾 Redis SET: ${key} (sem TTL)`);
      }
    } catch (error) {
      console.error(`❌ Erro ao salvar no Redis [${key}]:`, error.message);
    }
  }

  /**
   * Buscar valor no Redis
   * @param key Chave
   * @returns Valor parseado (ou null se não existir)
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      console.warn('⚠️  Redis não conectado, retornando null');
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (!value) {
        console.log(`🔍 Redis MISS: ${key}`);
        return null;
      }

      console.log(`✅ Redis HIT: ${key}`);

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar no Redis [${key}]:`, error.message);
      return null;
    }
  }

  /**
   * Deletar chave do Redis
   * @param key Chave
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️  Redis não conectado, ignorando del()');
      return;
    }

    try {
      await this.client.del(key);
      console.log(`🗑️  Redis DEL: ${key}`);
    } catch (error) {
      console.error(`❌ Erro ao deletar no Redis [${key}]:`, error.message);
    }
  }

  /**
   * Deletar múltiplas chaves (por padrão)
   * @param pattern Padrão (ex: "messages:*")
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️  Redis não conectado, ignorando delPattern()');
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`🗑️  Redis DEL pattern: ${pattern} (${keys.length} chaves)`);
      }
    } catch (error) {
      console.error(`❌ Erro ao deletar pattern no Redis [${pattern}]:`, error.message);
    }
  }

  /**
   * Listar todas as chaves
   * @param pattern Padrão (ex: "user:*")
   * @returns Array de chaves
   */
  async keys(pattern: string = '*'): Promise<string[]> {
    if (!this.isConnected) {
      console.warn('⚠️  Redis não conectado, retornando []');
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`❌ Erro ao listar chaves no Redis [${pattern}]:`, error.message);
      return [];
    }
  }

  /**
   * Verifica se o Redis está conectado
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
