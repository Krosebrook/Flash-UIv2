/**
 * AI Model Types and Interfaces
 * Defines the contract for all AI model providers
 */

export type ModelProvider = 'openai' | 'anthropic';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
  provider: ModelProvider;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface AIModelAdapter {
  sendRequest(request: AIRequest): Promise<AIResponse>;
  streamRequest(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown>;
  countTokens(text: string): number;
  validateRequest(request: AIRequest): boolean;
}

export interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  hits: number;
}

export interface UsageMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  cacheHits: number;
  cacheMisses: number;
  averageLatency: number;
}
