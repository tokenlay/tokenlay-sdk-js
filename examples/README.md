# Tokenlay SDK Examples

This directory contains practical examples demonstrating how to use the Tokenlay JavaScript SDK as a drop-in replacement for the OpenAI SDK.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install @tokenlay/sdk openai
   ```

2. **Set up environment variables:**
   Copy the template and add your API keys:
   ```bash
   cp examples/.env.template .env
   # Edit .env with your actual API keys
   ```

3. **Run any example:**
   ```bash
   node examples/basic.js
   ```

## Environment Setup

Create a `.env` file in the project root with these variables:

```bash
# Required
TOKENLAY_KEY="your_tokenlay_key"        # Get free at https://tokenlay.com
OPENAI_API_KEY="your_openai_key"        # Your OpenAI API key

# Optional (for advanced examples)
ANTHROPIC_API_KEY="your_anthropic_key"  # For Anthropic provider
OPENAI_API_KEY_BACKUP="backup_key"      # For key rotation example

# Optional (for local development)
TOKENLAY_BASE_URL="http://localhost:3000"  # Point to local proxy
```

## Examples

### 1. Basic Usage (`basic.js`)
The simplest way to get started - a drop-in replacement for OpenAI SDK.

```bash
node examples/basic.js
```

**What it demonstrates:**
- Basic client initialization
- Simple chat completion request
- Response handling and error management
- Environment variable configuration

### 2. Metadata & User Tracking (`metadata.js`)
Shows how to pass user context for intelligent routing and usage tracking.

```bash
node examples/metadata.js
```

**What it demonstrates:**
- Global and per-request metadata
- User tier-based routing (free, pro, enterprise)
- Extracting Tokenlay response metadata
- Dynamic metadata updates
- Feature-based usage tracking

### 3. Streaming Responses (`streaming.js`)
Demonstrates streaming chat completions for real-time user experience.

```bash
node examples/streaming.js
```

**What it demonstrates:**
- Streaming vs non-streaming requests
- Processing streaming chunks in real-time
- Metadata with streaming requests
- Multi-message conversation streaming
- Performance comparison

### 4. Advanced Features (`advanced.js`)
Comprehensive example showing production-ready features.

```bash
node examples/advanced.js
```

**What it demonstrates:**
- Health checks and monitoring
- Comprehensive error handling patterns
- Multiple provider support (OpenAI, Anthropic)
- Provider switching and failover
- API key rotation strategies
- Cost tracking and analytics
- Concurrent request processing

## Integration Testing

For testing the complete SDK → proxy flow:

```bash
node examples/integration-test.js
```

This runs a comprehensive test suite validating all functionality end-to-end.

## Common Usage Patterns

### 1. User-Based Routing
```javascript
const response = await client.chat.completions.create({
  model: 'gpt-3.5-turbo', // May be overridden by Tokenlay rules
  messages: [...],
  metadata: {
    userId: 'user_123',
    tier: 'pro',        // Free users might get cheaper models
    feature: 'chat',    // Track usage by feature
  }
});
```

### 2. Cost Monitoring
```javascript
import { getTokenlayMetadata } from '@tokenlay/sdk';

const response = await client.chat.completions.create({...});
const metadata = getTokenlayMetadata(response);

if (metadata) {
  console.log(`Cost: $${metadata.cost}`);
  console.log(`Tokens: ${metadata.tokensUsed}`);
  console.log(`Rule Applied: ${metadata.ruleId}`);
}
```

### 3. Error Handling
```javascript
try {
  const response = await client.chat.completions.create({...});
  // Handle success
} catch (error) {
  console.error('Request failed:', error.message);
  
  if (error.message.includes('rate limit')) {
    // Implement exponential backoff
    console.log('Rate limit hit - waiting before retry');
  } else if (error.message.includes('quota')) {
    // Handle quota exceeded
    console.log('Quota exceeded - consider upgrading plan');
  }
}
```

### 4. Streaming Responses
```javascript
const stream = await client.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [...],
  stream: true,
  metadata: { userId: 'user_123' }
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  if (content) {
    process.stdout.write(content); // Real-time output
  }
}
```

### 5. Multi-Provider Setup
```javascript
// OpenAI client
const openaiClient = new TokenlayOpenAI({
  tokenlayKey: process.env.TOKENLAY_KEY,
  providerApiKey: process.env.OPENAI_API_KEY,
});

// Anthropic client (if available)
const anthropicClient = new TokenlayOpenAI({
  tokenlayKey: process.env.TOKENLAY_KEY,
  providerApiKey: process.env.ANTHROPIC_API_KEY,
  providerApiBase: 'https://api.anthropic.com/v1',
});
```

## Development Tips

1. **Start with `basic.js`** to verify your setup works
2. **Use `metadata.js`** to understand intelligent routing capabilities
3. **Try `streaming.js`** to see real-time response generation
4. **Explore `advanced.js`** for production patterns and best practices
5. **Run `integration-test.js`** to validate your complete setup

## Troubleshooting

### Common Issues

**"tokenlayKey is required" Error:**
- Check that your `.env` file exists and contains `TOKENLAY_KEY`
- Ensure you're running commands from the project root directory

**"Cannot find module '@tokenlay/sdk'" Error:**
- Run `npm install` to install dependencies
- Make sure you're in the correct project directory

**API Key Errors:**
- Verify your API keys are correct and active
- Check that you have sufficient credits/quota
- Ensure API keys don't have extra spaces or quotes

**Rate Limit Errors:**
- Add delays between requests in loops
- Implement exponential backoff for retries
- Consider upgrading your API plan

### Getting Help

- Check the [Tokenlay Documentation](https://docs.tokenlay.com)
- Visit the [Tokenlay Dashboard](https://tokenlay.com) for usage monitoring
- Review examples for common patterns and solutions

## File Structure

```
examples/
├── README.md              # This file
├── .env.template          # Environment variable template
├── basic.js              # Basic usage example
├── metadata.js           # Metadata and user tracking
├── streaming.js          # Streaming responses
├── advanced.js           # Advanced features and patterns
└── integration-test.js   # Comprehensive test suite
```

## Next Steps

After exploring these examples:

1. **Set up rules** in the [Tokenlay Dashboard](https://tokenlay.com) to control routing and limits
2. **Monitor usage** to understand your application's AI consumption patterns
3. **Implement error handling** and retry logic for production use
4. **Add metadata** to enable intelligent routing and detailed analytics
5. **Consider multiple providers** for redundancy and cost optimization

Happy coding with Tokenlay! 🚀