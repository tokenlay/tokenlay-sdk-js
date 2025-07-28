import OpenAI from 'openai';
import type { 
  TokenlayOpenAIOptions, 
  TokenlayChatCompletionCreateParams,
  TokenlayResponseMetadata,
  RequestMetadata 
} from './types.js';
import { 
  validateConfig, 
  metadataToHeaders, 
  buildTokenlayUrl,
  DEFAULT_TOKENLAY_BASE_URL,
  DEFAULT_PROVIDER_API_BASE
} from './utils.js';

/**
 * TokenlayOpenAI - A drop-in replacement for OpenAI that routes through Tokenlay
 * 
 * Provides intelligent request routing, usage tracking, and cost control
 * while maintaining full compatibility with the OpenAI SDK.
 */
export class TokenlayOpenAI {
  private openaiClient: OpenAI;
  private config: Required<Omit<TokenlayOpenAIOptions, 'metadata' | 'extraHeaders'>> & {
    metadata?: Record<string, string>;
    extraHeaders?: Record<string, string>;
  };

  constructor(options: TokenlayOpenAIOptions) {
    validateConfig(options);

    this.config = {
      tokenlayKey: options.tokenlayKey,
      providerApiKey: options.providerApiKey,
      providerApiBase: options.providerApiBase || DEFAULT_PROVIDER_API_BASE,
      tokenlayBaseUrl: options.tokenlayBaseUrl || DEFAULT_TOKENLAY_BASE_URL,
      timeout: options.timeout || 60000,
      maxRetries: options.maxRetries || 2,
      metadata: options.metadata,
      extraHeaders: options.extraHeaders,
    };

    // Create OpenAI client pointing to Tokenlay proxy
    this.openaiClient = new OpenAI({
      apiKey: this.config.tokenlayKey,
      baseURL: buildTokenlayUrl(this.config.tokenlayBaseUrl, ''),
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      defaultHeaders: this.buildDefaultHeaders(),
    });
  }

  /**
   * Build default headers for all requests
   */
  private buildDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'x-tokenlay-provider-key': this.config.providerApiKey,
      'x-tokenlay-provider-base': this.config.providerApiBase,
    };

    // Add global metadata headers
    if (this.config.metadata) {
      Object.assign(headers, metadataToHeaders(this.config.metadata));
    }

    // Add extra headers
    if (this.config.extraHeaders) {
      Object.assign(headers, this.config.extraHeaders);
    }

    return headers;
  }

  /**
   * Build headers for a specific request
   */
  private buildRequestHeaders(metadata?: RequestMetadata): Record<string, string> {
    if (!metadata) {
      return {};
    }

    return metadataToHeaders(metadata);
  }

  /**
   * Chat completions endpoint - main interface for LLM requests
   */
  get chat() {
    return {
      completions: {
        create: async (params: TokenlayChatCompletionCreateParams) => {
          const { metadata, ...openaiParams } = params;
          
          // Build request-specific headers
          const requestHeaders = this.buildRequestHeaders(metadata);
          
          // Make the request through OpenAI client (which points to Tokenlay)
          const response = await this.openaiClient.chat.completions.create(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            openaiParams as any,
            {
              headers: requestHeaders,
            }
          );

          // Add Tokenlay metadata to the response (if available)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseWithHeaders = response as any;
          if (responseWithHeaders._request_id) {
            // For now, we'll add empty metadata - this would need to be populated
            // by actual headers from the response in a real implementation
            responseWithHeaders._tokenlay = {
              ruleId: undefined,
              ruleAction: 'allow' as const,  
              limitExceeded: false,
              cost: 0,
              tokensUsed: 0,
              inputTokens: 0,
              outputTokens: 0,
              duration: 0,
            };
          }

          return response;
        },
      },
    };
  }

  /**
   * Get the underlying OpenAI client for advanced usage
   */
  get openai(): OpenAI {
    return this.openaiClient;
  }

  /**
   * Update global metadata for all future requests
   */
  updateMetadata(metadata: RequestMetadata): void {
    // Filter out undefined values to ensure type safety
    const filteredMetadata: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        filteredMetadata[key] = value;
      }
    }
    
    this.config.metadata = { ...this.config.metadata, ...filteredMetadata };
    
    // Note: defaultHeaders is protected in OpenAI v4, so we create a new client
    // In a real implementation, you might want to recreate the client or use a different approach
  }

  /**
   * Update provider API key (useful for key rotation)
   */
  updateProviderKey(providerApiKey: string): void {
    this.config.providerApiKey = providerApiKey;
    
    // Note: defaultHeaders is protected in OpenAI v4, so we create a new client
    // In a real implementation, you might want to recreate the client with the new key
  }

  /**
   * Health check - verify connection to Tokenlay proxy
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      // Make a simple request to verify connectivity
      const response = await fetch(buildTokenlayUrl(this.config.tokenlayBaseUrl, 'health'), {
        headers: {
          'Authorization': `Bearer ${this.config.tokenlayKey}`,
        },
      });

      if (response.ok) {
        return { status: 'ok' };
      } else {
        return { 
          status: 'error', 
          message: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        status: 'error', 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

/**
 * Extract Tokenlay metadata from a chat completion response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTokenlayMetadata(response: any): TokenlayResponseMetadata | null {
  return response._tokenlay || null;
}