/**
 * Application Configuration
 * Centralized configuration with environment variable loading
 */

export const config = {
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      defaultModel: 'claude-3-5-sonnet-20241022',
      maxTokens: 8192,
    },
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gpt-3.5-turbo',
    enableCaching: process.env.AI_ENABLE_CACHING === 'true',
    cacheTTL: parseInt(process.env.AI_CACHE_TTL || '3600', 10),
    enableStreaming: process.env.ENABLE_STREAMING === 'true',
    enableGPU: process.env.ENABLE_GPU_ACCELERATION === 'true',
  },
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
  },
  logging: {
    enabled: process.env.ENABLE_LOGGING === 'true',
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export const isDevelopment = config.app.env === 'development';
export const isProduction = config.app.env === 'production';
