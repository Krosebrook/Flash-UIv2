/**
 * Utility functions for AI operations
 */

import { AIRequest } from '@/types/ai';
import crypto from 'crypto';

/**
 * Count tokens in text (approximate using GPT-style tokenization)
 * For production, use tiktoken library for accurate counting
 */
export function countTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  // For production, integrate tiktoken or similar
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = countTokens(text);
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  const ratio = maxTokens / estimatedTokens;
  const targetLength = Math.floor(text.length * ratio * 0.95); // 5% safety margin
  return text.slice(0, targetLength) + '...';
}

/**
 * Validate AI request structure and constraints
 */
export function validateAIRequest(request: AIRequest): { valid: boolean; error?: string } {
  if (!request.messages || request.messages.length === 0) {
    return { valid: false, error: 'Messages array is required and cannot be empty' };
  }

  for (const msg of request.messages) {
    if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: `Invalid message role: ${msg.role}` };
    }
    if (!msg.content || typeof msg.content !== 'string') {
      return { valid: false, error: 'Message content must be a non-empty string' };
    }
  }

  const maxTokens = request.maxTokens || 4096;
  if (maxTokens < 1 || maxTokens > 128000) {
    return { valid: false, error: 'Max tokens must be between 1 and 128000' };
  }

  return { valid: true };
}

/**
 * Generate cache key from request for consistent indexing
 * Uses prompt fingerprinting for cache lookups
 */
export function generateCacheKey(request: AIRequest): string {
  const normalizedRequest = {
    messages: request.messages.map(m => ({ role: m.role, content: m.content.trim() })),
    model: request.model,
    temperature: request.temperature || 0.7,
    maxTokens: request.maxTokens,
  };
  
  const stringified = JSON.stringify(normalizedRequest);
  return crypto.createHash('sha256').update(stringified).digest('hex');
}

/**
 * Sanitize user input to prevent prompt injection
 */
export function sanitizeInput(input: string): string {
  // Remove potentially harmful patterns
  let sanitized = input
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim();

  // Limit length
  const maxLength = 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize AI output
 */
export function sanitizeOutput(output: string): string {
  // Basic sanitization - can be extended based on use case
  return output
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

/**
 * Calculate cost estimate for tokens (USD)
 */
export function estimateCost(
  _provider: 'openai' | 'anthropic',
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Simplified pricing - update with actual rates
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
    'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    'claude-3-5-sonnet-20241022': { prompt: 0.003, completion: 0.015 },
  };

  const rates = pricing[model] || pricing['gpt-3.5-turbo'];
  return (promptTokens / 1000) * rates.prompt + (completionTokens / 1000) * rates.completion;
}

/**
 * Create a prompt template
 */
export function createPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}
