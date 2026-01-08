/**
 * Tests for AI utility functions
 */

import {
  countTokens,
  truncateToTokenLimit,
  validateAIRequest,
  generateCacheKey,
  sanitizeInput,
  sanitizeOutput,
  estimateCost,
  createPromptTemplate,
} from '../ai-utils';
import { AIRequest } from '@/types/ai';

describe('AI Utils', () => {
  describe('countTokens', () => {
    it('should count tokens approximately', () => {
      const text = 'Hello world';
      const tokens = countTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('should not truncate text within limit', () => {
      const text = 'Short text';
      const result = truncateToTokenLimit(text, 100);
      expect(result).toBe(text);
    });

    it('should truncate text exceeding limit', () => {
      const text = 'A'.repeat(1000);
      const result = truncateToTokenLimit(text, 10);
      expect(result.length).toBeLessThan(text.length);
      expect(result).toContain('...');
    });
  });

  describe('validateAIRequest', () => {
    it('should validate correct request', () => {
      const request: AIRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      const result = validateAIRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should reject empty messages', () => {
      const request: AIRequest = {
        messages: [],
      };
      const result = validateAIRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid role', () => {
      const request: any = {
        messages: [{ role: 'invalid', content: 'Hello' }],
      };
      const result = validateAIRequest(request);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid maxTokens', () => {
      const request: AIRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 200000,
      };
      const result = validateAIRequest(request);
      expect(result.valid).toBe(false);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys', () => {
      const request: AIRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      const key1 = generateCacheKey(request);
      const key2 = generateCacheKey(request);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different requests', () => {
      const request1: AIRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };
      const request2: AIRequest = {
        messages: [{ role: 'user', content: 'World' }],
      };
      const key1 = generateCacheKey(request1);
      const key2 = generateCacheKey(request2);
      expect(key1).not.toBe(key2);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML comments', () => {
      const input = 'Hello <!-- comment --> world';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<!--');
    });

    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should truncate long input', () => {
      const input = 'A'.repeat(20000);
      const result = sanitizeInput(input);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('sanitizeOutput', () => {
    it('should remove script tags from output', () => {
      const output = 'Result: <script>alert("xss")</script>';
      const result = sanitizeOutput(output);
      expect(result).not.toContain('<script>');
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost for GPT-4', () => {
      const cost = estimateCost('openai', 'gpt-4-turbo-preview', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });

    it('should calculate cost for Claude', () => {
      const cost = estimateCost('anthropic', 'claude-3-5-sonnet-20241022', 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('createPromptTemplate', () => {
    it('should replace variables', () => {
      const template = 'Hello {{name}}, you are {{age}} years old';
      const result = createPromptTemplate(template, { name: 'John', age: '30' });
      expect(result).toBe('Hello John, you are 30 years old');
    });

    it('should handle multiple occurrences', () => {
      const template = '{{x}} + {{x}} = {{result}}';
      const result = createPromptTemplate(template, { x: '5', result: '10' });
      expect(result).toBe('5 + 5 = 10');
    });
  });
});
