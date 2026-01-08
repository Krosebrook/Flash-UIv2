/**
 * Structured Logger
 * Production-grade logging with levels and context
 */

import { config } from '@/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private enabled: boolean;
  private level: LogLevel;

  constructor() {
    this.enabled = config.logging.enabled;
    this.level = config.logging.level as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Specialized logging methods
  aiRequest(requestId: string, model: string, tokenCount: number): void {
    this.info('AI Request', { requestId, model, tokenCount, type: 'ai_request' });
  }

  aiResponse(requestId: string, model: string, latency: number, cached: boolean): void {
    this.info('AI Response', { requestId, model, latency, cached, type: 'ai_response' });
  }

  aiError(requestId: string, error: Error, model?: string): void {
    this.error('AI Error', { requestId, model, error: error.message, type: 'ai_error' });
  }

  cacheHit(key: string): void {
    this.debug('Cache Hit', { key, type: 'cache_hit' });
  }

  cacheMiss(key: string): void {
    this.debug('Cache Miss', { key, type: 'cache_miss' });
  }

  performance(metric: string, value: number, unit: string): void {
    this.info('Performance Metric', { metric, value, unit, type: 'performance' });
  }
}

export const logger = new Logger();
