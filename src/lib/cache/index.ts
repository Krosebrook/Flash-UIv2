/**
 * Cache Implementation with LRU fallback
 * Supports Redis for distributed caching with in-memory LRU fallback
 */

import { config } from '@/config';
import { logger } from '@/lib/utils/logger';

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * In-memory LRU Cache implementation
 */
class LRUCache implements CacheAdapter {
  private cache: Map<string, { value: string; expiry: number }>;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  async set(key: string, value: string, ttl = 3600): Promise<void> {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Redis Cache implementation (optional)
 */
class RedisCache implements CacheAdapter {
  private client: unknown | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    if (!config.redis.url) {
      return;
    }

    try {
      // Dynamically import Redis to avoid bundling in browser
      const Redis = (await import('ioredis')).default;
      this.client = new Redis(config.redis.url, {
        password: config.redis.password,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) {
            logger.warn('Redis connection failed, falling back to LRU cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      await (this.client as InstanceType<typeof Redis>).connect();
      logger.info('Redis cache connected');
    } catch (error) {
      logger.warn('Redis initialization failed, using LRU cache', { error });
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    try {
      return await (this.client as import('ioredis').Redis).get(key);
    } catch (error) {
      logger.error('Redis get error', { error });
      return null;
    }
  }

  async set(key: string, value: string, ttl = 3600): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await (this.client as import('ioredis').Redis).setex(key, ttl, value);
    } catch (error) {
      logger.error('Redis set error', { error });
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await (this.client as import('ioredis').Redis).del(key);
    } catch (error) {
      logger.error('Redis delete error', { error });
    }
  }

  async clear(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await (this.client as import('ioredis').Redis).flushdb();
    } catch (error) {
      logger.error('Redis clear error', { error });
    }
  }
}

/**
 * Unified Cache Manager with automatic fallback
 */
class CacheManager implements CacheAdapter {
  private primary: CacheAdapter;
  private fallback: CacheAdapter;

  constructor() {
    this.fallback = new LRUCache();
    this.primary = config.redis.url ? new RedisCache() : this.fallback;
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.primary.get(key);
      if (value) {
        logger.cacheHit(key);
        return value;
      }
      logger.cacheMiss(key);
      return null;
    } catch (error) {
      logger.warn('Cache get error, trying fallback', { error });
      return this.fallback.get(key);
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      await this.primary.set(key, value, ttl);
    } catch (error) {
      logger.warn('Cache set error, trying fallback', { error });
      await this.fallback.set(key, value, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    await this.primary.delete(key);
  }

  async clear(): Promise<void> {
    await this.primary.clear();
  }
}

export const cache = new CacheManager();
