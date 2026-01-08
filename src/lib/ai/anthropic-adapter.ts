/**
 * Anthropic (Claude) Model Adapter
 * Implements streaming, token counting, and error handling for Claude models
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/config';
import { AIRequest, AIResponse, StreamChunk, AIModelAdapter, AIMessage } from '@/types/ai';
import { countTokens, validateAIRequest } from '@/lib/utils/ai-utils';
import { logger } from '@/lib/utils/logger';

export class AnthropicAdapter implements AIModelAdapter {
  private client: Anthropic;

  constructor() {
    if (!config.ai.anthropic.apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    this.client = new Anthropic({
      apiKey: config.ai.anthropic.apiKey,
    });
  }

  validateRequest(request: AIRequest): boolean {
    const validation = validateAIRequest(request);
    if (!validation.valid) {
      logger.error('Invalid Anthropic request', { error: validation.error });
      return false;
    }
    return true;
  }

  countTokens(text: string): number {
    return countTokens(text);
  }

  private convertMessages(messages: AIMessage[]): {
    system?: string;
    messages: Anthropic.MessageParam[];
  } {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    return {
      system: systemMessage?.content,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })) as Anthropic.MessageParam[],
    };
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid request structure');
    }

    const model = request.model || config.ai.anthropic.defaultModel;
    const { system, messages } = this.convertMessages(request.messages);
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model,
        messages,
        system,
        max_tokens: request.maxTokens || config.ai.anthropic.maxTokens,
        temperature: request.temperature ?? 0.7,
      });

      const latency = Date.now() - startTime;

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const aiResponse: AIResponse = {
        content,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        provider: 'anthropic',
      };

      logger.info('Anthropic request completed', {
        model,
        latency,
        tokens: aiResponse.usage.totalTokens,
      });

      return aiResponse;
    } catch (error) {
      logger.error('Anthropic request failed', { error, model });
      throw error;
    }
  }

  async *streamRequest(request: AIRequest): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.validateRequest(request)) {
      throw new Error('Invalid request structure');
    }

    const model = request.model || config.ai.anthropic.defaultModel;
    const { system, messages } = this.convertMessages(request.messages);

    try {
      const stream = await this.client.messages.create({
        model,
        messages,
        system,
        max_tokens: request.maxTokens || config.ai.anthropic.maxTokens,
        temperature: request.temperature ?? 0.7,
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield {
            content: event.delta.text,
            done: false,
          };
        }
      }

      yield {
        content: '',
        done: true,
      };

      logger.info('Anthropic stream completed', { model });
    } catch (error) {
      logger.error('Anthropic stream failed', { error, model });
      throw error;
    }
  }
}
