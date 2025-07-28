/**
 * Configuration options for TokenlayOpenAI client
 */
export interface TokenlayOpenAIOptions {
  /**
   * Your Tokenlay API key - get one free at https://tokenlay.com
   */
  tokenlayKey: string;

  /**
   * Your provider API key (e.g., OpenAI API key)
   */
  providerApiKey: string;

  /**
   * Provider API base URL (optional, defaults to OpenAI)
   * Examples:
   * - OpenAI: "https://api.openai.com/v1"
   * - Anthropic: "https://api.anthropic.com/v1"
   * - Azure: "https://your-resource.openai.azure.com/"
   */
  providerApiBase?: string;

  /**
   * Tokenlay proxy base URL (defaults to production)
   */
  tokenlayBaseUrl?: string;

  /**
   * Global metadata headers to include with all requests
   * These can be used for user tracking, feature attribution, etc.
   */
  metadata?: Record<string, string>;

  /**
   * Additional headers to include with all requests
   */
  extraHeaders?: Record<string, string>;

  /**
   * Request timeout in milliseconds (default: 60000)
   */
  timeout?: number;

  /**
   * Maximum number of retries (default: 2)
   */
  maxRetries?: number;
}

/**
 * Per-request metadata options
 */
export interface RequestMetadata {
  /**
   * User identifier for tracking and limits
   */
  userId?: string;

  /**
   * User tier/plan for rule-based routing
   */
  tier?: string;

  /**
   * Feature name for attribution
   */
  feature?: string;

  /**
   * Project or organization identifier
   */
  projectId?: string;

  /**
   * Custom metadata fields
   */
  [key: string]: string | undefined;
}

/**
 * Tokenlay-specific response metadata
 */
export interface TokenlayResponseMetadata {
  /**
   * Rule that was applied to this request
   */
  ruleId?: string;

  /**
   * Action taken by the rule engine
   */
  ruleAction: 'allow' | 'block' | 'warn' | 'queue';

  /**
   * Whether any limits were exceeded
   */
  limitExceeded: boolean;

  /**
   * Cost of this request in USD
   */
  cost: number;

  /**
   * Total tokens used
   */
  tokensUsed: number;

  /**
   * Input tokens
   */
  inputTokens: number;

  /**
   * Output tokens
   */
  outputTokens: number;

  /**
   * Processing duration in milliseconds
   */
  duration: number;

  /**
   * Warnings from the rules engine
   */
  warnings?: string[];
}

/**
 * Extended chat completion options with Tokenlay metadata
 */
export interface TokenlayChatCompletionCreateParams {
  /**
   * Per-request metadata (overrides global metadata)
   */
  metadata?: RequestMetadata;

  /**
   * All other OpenAI chat completion parameters
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}