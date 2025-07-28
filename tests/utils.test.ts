import { describe, it, expect } from 'vitest';
import {
  metadataToHeaders,
  mergeHeaders,
  validateConfig,
  parseTokenlayHeaders,
  buildTokenlayUrl,
} from '../src/utils.js';

describe('utils', () => {
  describe('metadataToHeaders', () => {
    it('should convert metadata to prefixed headers', () => {
      const metadata = {
        userId: 'user_123',
        tier: 'pro',
        feature: 'chat',
      };

      const headers = metadataToHeaders(metadata);

      expect(headers).toEqual({
        'x-tokenlay-userId': 'user_123',
        'x-tokenlay-tier': 'pro',
        'x-tokenlay-feature': 'chat',
      });
    });

    it('should skip undefined values', () => {
      const metadata = {
        userId: 'user_123',
        tier: undefined,
        feature: 'chat',
      };

      const headers = metadataToHeaders(metadata);

      expect(headers).toEqual({
        'x-tokenlay-userId': 'user_123',
        'x-tokenlay-feature': 'chat',
      });
    });

    it('should handle empty metadata', () => {
      const headers = metadataToHeaders({});
      expect(headers).toEqual({});
    });
  });

  describe('mergeHeaders', () => {
    it('should merge multiple header objects', () => {
      const headers1 = { 'Content-Type': 'application/json' };
      const headers2 = { 'Authorization': 'Bearer token' };
      const headers3 = { 'X-Custom': 'value' };

      const merged = mergeHeaders(headers1, headers2, headers3);

      expect(merged).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'X-Custom': 'value',
      });
    });

    it('should handle undefined headers', () => {
      const headers1 = { 'Content-Type': 'application/json' };
      const headers2 = undefined;
      const headers3 = { 'X-Custom': 'value' };

      const merged = mergeHeaders(headers1, headers2, headers3);

      expect(merged).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });
    });

    it('should overwrite duplicate keys with later values', () => {
      const headers1 = { 'X-Key': 'value1' };
      const headers2 = { 'X-Key': 'value2' };

      const merged = mergeHeaders(headers1, headers2);

      expect(merged).toEqual({
        'X-Key': 'value2',
      });
    });
  });

  describe('validateConfig', () => {
    it('should pass with valid config', () => {
      const config = {
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw when tokenlayKey is missing', () => {
      const config = {
        providerApiKey: 'sk-test-456',
      };

      expect(() => validateConfig(config)).toThrow('tokenlayKey is required');
    });

    it('should throw when providerApiKey is missing', () => {
      const config = {
        tokenlayKey: 'tk_test_123',
      };

      expect(() => validateConfig(config)).toThrow('providerApiKey is required');
    });

    it('should throw when both keys are missing', () => {
      const config = {};

      expect(() => validateConfig(config)).toThrow('tokenlayKey is required');
    });
  });

  describe('parseTokenlayHeaders', () => {
    it('should parse all Tokenlay headers correctly', () => {
      const headers = {
        'x-tokenlay-rule-id': 'rule_123',
        'x-tokenlay-rule-action': 'allow',
        'x-tokenlay-limit-exceeded': 'false',
        'x-tokenlay-cost': '0.00018',
        'x-tokenlay-tokens-used': '18',
        'x-tokenlay-input-tokens': '10',
        'x-tokenlay-output-tokens': '8',
        'x-tokenlay-duration': '1500',
        'x-tokenlay-warnings': '["Warning message"]',
      };

      const metadata = parseTokenlayHeaders(headers);

      expect(metadata).toEqual({
        ruleId: 'rule_123',
        ruleAction: 'allow',
        limitExceeded: false,
        cost: 0.00018,
        tokensUsed: 18,
        inputTokens: 10,
        outputTokens: 8,
        duration: 1500,
        warnings: ['Warning message'],
      });
    });

    it('should handle missing headers with defaults', () => {
      const headers = {};

      const metadata = parseTokenlayHeaders(headers);

      expect(metadata).toEqual({
        ruleId: undefined,
        ruleAction: 'allow',
        limitExceeded: false,
        cost: 0,
        tokensUsed: 0,
        inputTokens: 0,
        outputTokens: 0,
        duration: 0,
        warnings: undefined,
      });
    });

    it('should handle invalid JSON in warnings', () => {
      const headers = {
        'x-tokenlay-warnings': 'invalid-json',
      };

      expect(() => parseTokenlayHeaders(headers)).toThrow();
    });
  });

  describe('buildTokenlayUrl', () => {
    it('should build URL correctly', () => {
      const url = buildTokenlayUrl('https://api.tokenlay.com', 'chat/completions');
      expect(url).toBe('https://api.tokenlay.com/v1/chat/completions');
    });

    it('should handle trailing slash in base URL', () => {
      const url = buildTokenlayUrl('https://api.tokenlay.com/', 'chat/completions');
      expect(url).toBe('https://api.tokenlay.com/v1/chat/completions');
    });

    it('should handle leading slash in endpoint', () => {
      const url = buildTokenlayUrl('https://api.tokenlay.com', '/chat/completions');
      expect(url).toBe('https://api.tokenlay.com/v1/chat/completions');
    });

    it('should handle both trailing and leading slashes', () => {
      const url = buildTokenlayUrl('https://api.tokenlay.com/', '/chat/completions');
      expect(url).toBe('https://api.tokenlay.com/v1/chat/completions');
    });
  });
});