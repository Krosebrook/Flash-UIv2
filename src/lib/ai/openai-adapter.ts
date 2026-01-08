/**
 * OpenAI Model Adapter
 * Implements streaming, token counting, and error handling for OpenAI models
 */

import OpenAI from 'openai';
import { config } from '@/config';
import { AIRequest, AIResponse, StreamChunk, AIModelAdapter } from '@/types/ai';
import { countTokens, validateAIRequest } from '@/lib/utils/ai-utils';
import { logger } from '@/lib/utils/logger';

export class OpenAIAdapter implements AIModelAdapter {
  private client: OpenAI;

  constructor() {
    if (!config.ai.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.client = new OpenAI({
      apiKey: config.ai.openai.apiKey,
    });
  }

  validateRequest(request: AIRequest): boolean {
    const validation = validateAIRequest(request);
    if (!validation.valid) {
      logger.error('Invalid OpenAI request', { error: validation.error });
      return false;
    }
    return true;
  }

  countTokens(text: string): number {
    return countTokens(text);
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid request structure');
    }

    const model = request.model || config.ai.openai.defaultModel;
    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        max_tokens: request.maxTokens || config.ai.openai.maxTokens,
        temperature: request.temperature ?? 0.7,
        stream: false,
      });

      const latency = Date.now() - startTime;

      const response: AIResponse = {
        content: completion.choices[0]?.message?.content || '',
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        provider: 'openai',
      };

      logger.info('OpenAI request completed', {
        model,
        latency,
        tokens: response.usage.totalTokens,
      });

      return response;
    } catch (error) {
      logger.error('OpenAI request failed', { error, model });
      throw error;
    }
  }

  async *streamRequest(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid request structure');
    }

    const model = request.model || config.ai.openai.defaultModel;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        max_tokens: request.maxTokens || config.ai.openai.maxTokens,
        temperature: request.temperature ?? 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield {
            content,
            done: false,
          };
        }
      }

      yield {
        content: '',
        done: true,
      };

      logger.info('OpenAI stream completed', { model });
    } catch (error) {
      logger.error('OpenAI stream failed', { error, model });
      throw error;
    }
  }
}
