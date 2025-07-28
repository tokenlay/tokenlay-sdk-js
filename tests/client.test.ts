import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenlayOpenAI, getTokenlayMetadata } from '../src/client.js';
import { DEFAULT_TOKENLAY_BASE_URL, DEFAULT_PROVIDER_API_BASE } from '../src/utils.js';

// Mock OpenAI
const mockCreate = vi.fn().mockResolvedValue({
  id: 'chatcmpl-test',
  object: 'chat.completion',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
      },
      finish_reason: 'stop',
      index: 0,
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 8,
    total_tokens: 18,
  },
  _request_id: 'req_test_123',
});

vi.mock('openai', () => {
  const mockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
  
  return {
    default: mockOpenAI,
  };
});

// Mock fetch for health check
global.fetch = vi.fn();

describe('TokenlayOpenAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with required config', () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      expect(client).toBeInstanceOf(TokenlayOpenAI);
    });

    it('should throw error when tokenlayKey is missing', () => {
      expect(() => {
        new TokenlayOpenAI({
          tokenlayKey: '',
          providerApiKey: 'sk-test-456',
        });
      }).toThrow('tokenlayKey is required');
    });

    it('should throw error when providerApiKey is missing', () => {
      expect(() => {
        new TokenlayOpenAI({
          tokenlayKey: 'tk_test_123',
          providerApiKey: '',
        });
      }).toThrow('providerApiKey is required');
    });

    it('should use default values for optional config', () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      // Access private config through type assertion for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = (client as any).config;
      expect(config.tokenlayBaseUrl).toBe(DEFAULT_TOKENLAY_BASE_URL);
      expect(config.providerApiBase).toBe(DEFAULT_PROVIDER_API_BASE);
      expect(config.timeout).toBe(60000);
      expect(config.maxRetries).toBe(2);
    });

    it('should use custom config values', () => {
      const customConfig = {
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
        tokenlayBaseUrl: 'https://custom.tokenlay.com',
        providerApiBase: 'https://api.anthropic.com/v1',
        timeout: 30000,
        maxRetries: 5,
        metadata: { userId: 'user_123' },
      };

      const client = new TokenlayOpenAI(customConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = (client as any).config;

      expect(config.tokenlayBaseUrl).toBe(customConfig.tokenlayBaseUrl);
      expect(config.providerApiBase).toBe(customConfig.providerApiBase);
      expect(config.timeout).toBe(customConfig.timeout);
      expect(config.maxRetries).toBe(customConfig.maxRetries);
      expect(config.metadata).toEqual(customConfig.metadata);
    });
  });

  describe('chat.completions.create', () => {
    it('should make chat completion request', async () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      expect(response).toBeDefined();
      expect(response.choices[0].message.content).toBe('Hello! How can I help you today?');
    });

    it('should pass metadata as headers', async () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      const localMockCreate = vi.fn().mockResolvedValue({
        id: 'test',
        choices: [{ message: { content: 'test' } }],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).openaiClient.chat.completions.create = localMockCreate;

      await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }],
        metadata: {
          userId: 'user_123',
          tier: 'pro',
          feature: 'chat',
        },
      });

      expect(localMockCreate).toHaveBeenCalledWith(
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello!' }],
        },
        {
          headers: {
            'x-tokenlay-userId': 'user_123',
            'x-tokenlay-tier': 'pro',
            'x-tokenlay-feature': 'chat',
          },
        }
      );
    });

    it('should attach Tokenlay metadata to response', async () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }],
      });

      const metadata = getTokenlayMetadata(response);
      expect(metadata).toBeDefined();
      expect(metadata?.ruleId).toBe('test-rule');
      expect(metadata?.ruleAction).toBe('allow');
      expect(metadata?.cost).toBe(0.00018);
      expect(metadata?.tokensUsed).toBe(18);
    });
  });

  describe('updateMetadata', () => {
    it('should update global metadata', () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      client.updateMetadata({ userId: 'user_456', tier: 'enterprise' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = (client as any).config;
      expect(config.metadata).toEqual({
        userId: 'user_456',
        tier: 'enterprise',
      });
    });
  });

  describe('updateProviderKey', () => {
    it('should update provider API key', () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      client.updateProviderKey('sk-new-key-789');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = (client as any).config;
      expect(config.providerApiKey).toBe('sk-new-key-789');
    });
  });

  describe('healthCheck', () => {
    it('should return ok status when health check passes', async () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const result = await client.healthCheck();
      expect(result).toEqual({ status: 'ok' });
    });

    it('should return error status when health check fails', async () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await client.healthCheck();
      expect(result).toEqual({
        status: 'error',
        message: 'HTTP 401: Unauthorized',
      });
    });

    it('should handle network errors', async () => {
      const client = new TokenlayOpenAI({
        tokenlayKey: 'tk_test_123',
        providerApiKey: 'sk-test-456',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.healthCheck();
      expect(result).toEqual({
        status: 'error',
        message: 'Network error',
      });
    });
  });
});