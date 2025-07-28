/**
 * @tokenlay/sdk - JavaScript SDK for Tokenlay AI Operations Platform
 * 
 * A drop-in replacement for OpenAI that adds intelligent routing,
 * usage tracking, and cost control to your AI applications.
 * 
 * @example
 * ```typescript
 * import { TokenlayOpenAI } from '@tokenlay/sdk';
 * 
 * const client = new TokenlayOpenAI({
 *   tokenlayKey: process.env.TOKENLAY_KEY,
 *   providerApiKey: process.env.OPENAI_API_KEY,
 * });
 * 
 * const response = await client.chat.completions.create({
 *   model: 'gpt-3.5-turbo',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   metadata: { userId: 'user_123', tier: 'pro' }
 * });
 * ```
 */

export { TokenlayOpenAI, getTokenlayMetadata } from './client.js';
export type {
  TokenlayOpenAIOptions,
  RequestMetadata,
  TokenlayResponseMetadata,
  TokenlayChatCompletionCreateParams,
} from './types.js';

// Version
export const VERSION = '0.1.0';