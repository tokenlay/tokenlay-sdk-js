import type { RequestMetadata } from './types.js';

/**
 * Default Tokenlay proxy URL
 */
export const DEFAULT_TOKENLAY_BASE_URL = 'https://api.tokenlay.com';

/**
 * Default OpenAI API base URL
 */
export const DEFAULT_PROVIDER_API_BASE = 'https://api.openai.com/v1';

/**
 * Convert metadata object to headers with proper prefixing
 */
export function metadataToHeaders(metadata: RequestMetadata): Record<string, string> {
  const headers: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      headers[`x-tokenlay-${key}`] = value;
    }
  }
  
  return headers;
}

/**
 * Merge multiple header objects, with later objects taking precedence
 */
export function mergeHeaders(...headerObjects: (Record<string, string> | undefined)[]): Record<string, string> {
  const merged: Record<string, string> = {};
  
  for (const headers of headerObjects) {
    if (headers) {
      Object.assign(merged, headers);
    }
  }
  
  return merged;
}

/**
 * Validate that required configuration is present
 */
export function validateConfig(config: { tokenlayKey?: string; providerApiKey?: string }) {
  if (!config.tokenlayKey) {
    throw new Error('tokenlayKey is required. Get your free key at https://tokenlay.com');
  }
  
  if (!config.providerApiKey) {
    throw new Error('providerApiKey is required. This should be your OpenAI API key or other provider key.');
  }
}

/**
 * Parse Tokenlay response headers to extract metadata
 */
export function parseTokenlayHeaders(headers: Record<string, string>) {
  const metadata = {
    ruleId: headers['x-tokenlay-rule-id'],
    ruleAction: headers['x-tokenlay-rule-action'] as 'allow' | 'block' | 'warn' | 'queue' || 'allow',
    limitExceeded: headers['x-tokenlay-limit-exceeded'] === 'true',
    cost: parseFloat(headers['x-tokenlay-cost'] || '0'),
    tokensUsed: parseInt(headers['x-tokenlay-tokens-used'] || '0', 10),
    inputTokens: parseInt(headers['x-tokenlay-input-tokens'] || '0', 10),
    outputTokens: parseInt(headers['x-tokenlay-output-tokens'] || '0', 10),
    duration: parseInt(headers['x-tokenlay-duration'] || '0', 10),
    warnings: headers['x-tokenlay-warnings'] ? JSON.parse(headers['x-tokenlay-warnings']) : undefined,
  };
  
  return metadata;
}

/**
 * Build the full URL for Tokenlay proxy endpoint
 */
export function buildTokenlayUrl(baseUrl: string, endpoint: string): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${cleanBase}/v1/${cleanEndpoint}`;
}