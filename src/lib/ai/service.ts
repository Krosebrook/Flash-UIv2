/**
 * AI Service Orchestrator
 * Main service layer with caching, retry logic, fallback models, and usage tracking
 */

import { config } from '@/config';
import { OpenAIAdapter } from './openai-adapter';
import { AnthropicAdapter } from './anthropic-adapter';
import { cache } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import {
  AIRequest,
  AIResponse,
  StreamChunk,
  ModelProvider,
  UsageMetrics,
  AIModelAdapter,
} from '@/types/ai';
import {
  generateCacheKey,
  sanitizeInput,
  sanitizeOutput,
  estimateCost,
} from '@/lib/utils/ai-utils';
import { v4 as uuidv4 } from 'uuid';

export class AIService {
  private adapters: Map<ModelProvider, AIModelAdapter>;
  private metrics: UsageMetrics;

  constructor() {
    this.adapters = new Map();
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLatency: 0,
    };

    // Initialize adapters based on available API keys
    try {
      if (config.ai.openai.apiKey) {
        this.adapters.set('openai', new OpenAIAdapter());
      }
    } catch (error) {
      logger.warn('OpenAI adapter initialization failed', { error });
    }

    try {
      if (config.ai.anthropic.apiKey) {
        this.adapters.set('anthropic', new AnthropicAdapter());
      }
    } catch (error) {
      logger.warn('Anthropic adapter initialization failed', { error });
    }

    if (this.adapters.size === 0) {
      logger.warn('No AI adapters available - check API key configuration');
    }
  }

  private getAdapter(provider?: ModelProvider): AIModelAdapter {
    // If provider specified and available, use it
    if (provider && this.adapters.has(provider)) {
      return this.adapters.get(provider)!;
    }

    // Otherwise use first available adapter
    const adapter = this.adapters.values().next().value;
    if (!adapter) {
      throw new Error('No AI adapters available');
    }

    return adapter;
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, { error });

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private updateMetrics(response: AIResponse, latency: number, cached: boolean): void {
    this.metrics.totalRequests++;
    this.metrics.totalTokens += response.usage.totalTokens;
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Update average latency
    const prevTotal = this.metrics.averageLatency * (this.metrics.totalRequests - 1);
    this.metrics.averageLatency = (prevTotal + latency) / this.metrics.totalRequests;

    // Calculate cost
    const cost = estimateCost(
      response.provider,
      response.model,
      response.usage.promptTokens,
      response.usage.completionTokens
    );
    this.metrics.totalCost += cost;
  }

  /**
   * Send AI request with caching, retry, and fallback
   */
  async sendRequest(
    request: AIRequest,
    provider?: ModelProvider
  ): Promise<AIResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Sanitize input
    const sanitizedRequest: AIRequest = {
      ...request,
      messages: request.messages.map(msg => ({
        ...msg,
        content: sanitizeInput(msg.content),
      })),
    };

    // Check cache if enabled
    if (config.ai.enableCaching && !request.stream) {
      const cacheKey = generateCacheKey(sanitizedRequest);
      const cached = await cache.get(cacheKey);

      if (cached) {
        try {
          const response: AIResponse = JSON.parse(cached);
          response.cached = true;
          const latency = Date.now() - startTime;
          
          this.updateMetrics(response, latency, true);
          logger.aiResponse(requestId, response.model, latency, true);
          
          return response;
        } catch (error) {
          logger.warn('Cache parse error', { error });
        }
      }
    }

    // Get adapter and send request with retry
    try {
      const adapter = this.getAdapter(provider);
      const model = request.model || config.ai.openai.defaultModel;
      
      logger.aiRequest(requestId, model, adapter.countTokens(
        sanitizedRequest.messages.map(m => m.content).join(' ')
      ));

      const response = await this.retryWithBackoff(
        () => adapter.sendRequest(sanitizedRequest)
      );

      // Sanitize output
      response.content = sanitizeOutput(response.content);

      const latency = Date.now() - startTime;
      this.updateMetrics(response, latency, false);
      logger.aiResponse(requestId, response.model, latency, false);

      // Cache response if enabled
      if (config.ai.enableCaching && !request.stream) {
        const cacheKey = generateCacheKey(sanitizedRequest);
        await cache.set(
          cacheKey,
          JSON.stringify(response),
          config.ai.cacheTTL
        );
      }

      return response;
    } catch (error) {
      logger.aiError(requestId, error as Error, request.model);

      // Try fallback model if primary fails
      if (provider && this.adapters.size > 1) {
        logger.info('Attempting fallback model', { requestId });
        const fallbackProvider = provider === 'openai' ? 'anthropic' : 'openai';
        
        if (this.adapters.has(fallbackProvider)) {
          return this.sendRequest(
            { ...sanitizedRequest, model: config.ai.fallbackModel },
            fallbackProvider
          );
        }
      }

      throw error;
    }
  }

  /**
   * Stream AI request (no caching for streams)
   */
  async *streamRequest(
    request: AIRequest,
    provider?: ModelProvider
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const requestId = uuidv4();

    // Sanitize input
    const sanitizedRequest: AIRequest = {
      ...request,
      stream: true,
      messages: request.messages.map(msg => ({
        ...msg,
        content: sanitizeInput(msg.content),
      })),
    };

    try {
      const adapter = this.getAdapter(provider);
      const model = request.model || config.ai.openai.defaultModel;

      logger.aiRequest(requestId, model, adapter.countTokens(
        sanitizedRequest.messages.map(m => m.content).join(' ')
      ));

      yield* adapter.streamRequest(sanitizedRequest);
    } catch (error) {
      logger.aiError(requestId, error as Error, request.model);
      throw error;
    }
  }

  /**
   * Get usage metrics
   */
  getMetrics(): UsageMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLatency: 0,
    };
  }
}

// Singleton instance
export const aiService = new AIService();
