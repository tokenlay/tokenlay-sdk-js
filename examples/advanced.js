/**
 * Advanced Features Example
 * 
 * This comprehensive example demonstrates production-ready features including:
 * - Health checks and monitoring
 * - Multi-provider support (OpenAI, Anthropic)
 * - Advanced error handling patterns
 * - Provider switching and failover
 * - API key rotation
 * - Cost tracking and analytics
 * - Timeout and retry configuration
 * 
 * Run with: node examples/advanced.js
 */

import { TokenlayOpenAI, getTokenlayMetadata } from '@tokenlay/sdk';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Validate required environment variables
function validateEnvironment() {
  const required = ['TOKENLAY_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('💡 Please check your .env file');
    process.exit(1);
  }
}

validateEnvironment();

/**
 * Initialize client with Anthropic provider (if available)
 * @type {TokenlayOpenAI|null}
 */
let anthropicClient = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new TokenlayOpenAI({
    tokenlayKey: process.env.TOKENLAY_KEY,
    providerApiKey: process.env.ANTHROPIC_API_KEY,
    providerApiBase: 'https://api.anthropic.com/v1',
    timeout: 30000,
    maxRetries: 3,
    metadata: {
      provider: 'anthropic',
      environment: 'demo',
    }
  });
}

/**
 * Initialize client with OpenAI provider
 * @type {TokenlayOpenAI}
 */
const openaiClient = new TokenlayOpenAI({
  tokenlayKey: process.env.TOKENLAY_KEY,
  providerApiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 2,
  metadata: {
    provider: 'openai',
    environment: 'demo',
  }
});

/**
 * Demonstrates health check functionality
 * Health checks help monitor service availability and connectivity
 */
async function healthCheckExample() {
  console.log('🏥 --- Health Check Example ---');
  
  const clients = [
    { name: 'OpenAI', client: openaiClient },
  ];
  
  // Add Anthropic client if API key is available
  if (anthropicClient) {
    clients.push({ name: 'Anthropic', client: anthropicClient });
  } else {
    console.log('ℹ️  Anthropic client skipped (no ANTHROPIC_API_KEY found)');
  }

  for (const { name, client } of clients) {
    try {
      console.log(`\\n🔍 Checking ${name} health...`);
      
      // Note: healthCheck() method may not be implemented in current SDK
      // This is a demonstration of the pattern
      const health = await client.healthCheck?.() || { status: 'unknown', message: 'Health check not implemented' };
      
      if (health.status === 'healthy') {
        console.log(`✅ ${name}: Service is healthy`);
      } else {
        console.log(`⚠️  ${name}: ${health.status} - ${health.message || 'No details'}`);
      }
      
    } catch (error) {
      console.log(`❌ ${name}: Health check failed - ${error.message}`);
    }
  }
}

/**
 * Demonstrates comprehensive error handling patterns
 * Shows how to handle different types of API errors gracefully
 */
async function errorHandlingExample() {
  console.log('\\n🛡️  --- Error Handling Example ---');
  
  // Test scenarios with different error conditions
  const testCases = [
    {
      name: 'Valid Request',
      config: {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }],
        metadata: { testCase: 'valid_request' }
      }
    },
    {
      name: 'Invalid Model',
      config: {
        model: 'invalid-model-name',
        messages: [{ role: 'user', content: 'Test with invalid model' }],
        metadata: { testCase: 'invalid_model' }
      }
    },
    {
      name: 'Empty Messages',
      config: {
        model: 'gpt-3.5-turbo',
        messages: [], // This should cause an error
        metadata: { testCase: 'empty_messages' }
      }
    },
  ];
  
  for (const testCase of testCases) {
    console.log(`\\n🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await openaiClient.chat.completions.create(testCase.config);
      console.log(`✅ Success: ${response.choices[0].message.content.substring(0, 50)}...`);
      
    } catch (error) {
      console.log(`❌ Expected error caught: ${error.message}`);
      
      // Handle specific error types
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        console.log('🔄 Rate limit detected - implement exponential backoff');
      } else if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
        console.log('💳 Quota exceeded - consider upgrading plan or switching providers');
      } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        console.log('⚙️  Invalid parameter - check request configuration');
      } else if (error.message.includes('timeout')) {
        console.log('⏱️  Timeout - consider increasing timeout or retrying');
      } else {
        console.log('🔍 Unexpected error - investigate further');
      }
    }
    
    // Brief delay between test cases
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Demonstrates provider switching and comparison
 * Shows how to use multiple providers for redundancy or comparison
 */
async function providerSwitchingExample() {
  console.log('\\n🔀 --- Provider Switching Example ---');
  
  const providers = [
    {
      name: 'OpenAI GPT-3.5',
      client: openaiClient,
      model: 'gpt-3.5-turbo',
      available: true,
    },
  ];
  
  // Add Anthropic if available
  if (anthropicClient) {
    providers.push({
      name: 'Anthropic Claude',
      client: anthropicClient,
      model: 'claude-3-haiku-20240307',
      available: true,
    });
  }

  const question = 'What is the capital of France? Answer in exactly one sentence.';
  console.log(`\\n❓ Question: "${question}"`);

  for (const provider of providers) {
    if (!provider.available) {
      console.log(`\\n⏭️  Skipping ${provider.name} (not available)`);
      continue;
    }
    
    try {
      console.log(`\\n🚀 Trying ${provider.name}...`);
      const startTime = Date.now();
      
      const response = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [{ role: 'user', content: question }],
        max_tokens: 50, // Keep responses short for comparison
        metadata: {
          provider: provider.name.toLowerCase().replace(/\\s+/g, '_'),
          experimentId: 'provider_comparison_' + Date.now(),
          testType: 'provider_switching',
        }
      });

      const duration = Date.now() - startTime;
      console.log(`✅ ${provider.name} Response (${duration}ms):`);
      console.log(`   "${response.choices[0].message.content}"`);
      
      // Extract cost and usage information
      const metadata = getTokenlayMetadata(response);
      if (metadata && metadata.cost) {
        console.log(`💰 Cost: $${metadata.cost.toFixed(6)} | Tokens: ${metadata.tokensUsed}`);
      } else {
        console.log(`📊 Usage: ${response.usage?.total_tokens || 'unknown'} tokens`);
      }
      
    } catch (error) {
      console.log(`❌ ${provider.name} failed: ${error.message}`);
      console.log(`💡 This is why having multiple providers is important for redundancy`);
    }
    
    // Brief delay between providers
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

/**
 * Demonstrates API key rotation
 * Important for security and key management in production
 */
async function keyRotationExample() {
  console.log('\\n🔑 --- API Key Rotation Example ---');
  
  const oldKey = process.env.OPENAI_API_KEY;
  const newKey = process.env.OPENAI_API_KEY_BACKUP || oldKey; // Use backup if available
  
  console.log('🔐 Current key:', oldKey.substring(0, 10) + '...');
  
  if (newKey === oldKey) {
    console.log('ℹ️  No backup key available (OPENAI_API_KEY_BACKUP not set)');
    console.log('💡 Simulating rotation with same key for demonstration');
  }
  
  try {
    // Update the provider key (this method may not exist in current SDK)
    if (typeof openaiClient.updateProviderKey === 'function') {
      openaiClient.updateProviderKey(newKey);
      console.log('🔄 Updated to new key:', newKey.substring(0, 10) + '...');
    } else {
      console.log('⚠️  updateProviderKey method not available in current SDK version');
      console.log('💡 Key rotation would typically be handled during client initialization');
    }
    
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test message with rotated key - respond with "Key rotation successful!"' }],
      max_tokens: 20,
      metadata: { 
        keyRotation: 'true',
        testType: 'key_rotation',
      }
    });
    
    console.log('✅ Key rotation test successful!');
    console.log('📝 Response:', response.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ Key rotation test failed:', error.message);
    console.log('💡 In production, implement proper key rotation with graceful fallback');
  }
}

/**
 * Demonstrates cost tracking and analytics
 * Essential for monitoring and budgeting API usage
 */
async function costTrackingExample() {
  console.log('\\n💰 --- Cost Tracking & Analytics Example ---');
  
  let totalCost = 0;
  let totalTokens = 0;
  let successfulRequests = 0;
  const startTime = Date.now();
  
  const requests = [
    'What is machine learning in one sentence?',
    'Explain quantum computing briefly.',
    'Write a haiku about programming.',
    'List 3 benefits of cloud computing.',
    'What is the difference between AI and ML?',
  ];

  console.log(`📊 Processing ${requests.length} requests for cost analysis...`);

  for (const [index, prompt] of requests.entries()) {
    console.log(`\\n📤 Request ${index + 1}/${requests.length}: "${prompt.substring(0, 40)}..."`);
    
    try {
      const requestStart = Date.now();
      
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100, // Limit response length for consistent cost comparison
        metadata: {
          batchId: 'cost_tracking_batch_' + Date.now(),
          requestIndex: index.toString(),
          testType: 'cost_analysis',
        }
      });

      const requestDuration = Date.now() - requestStart;
      successfulRequests++;

      // Extract cost and usage metadata
      const metadata = getTokenlayMetadata(response);
      const cost = metadata?.cost || 0;
      const tokens = metadata?.tokensUsed || response.usage?.total_tokens || 0;
      
      totalCost += cost;
      totalTokens += tokens;
      
      console.log(`✅ Completed in ${requestDuration}ms`);
      console.log(`   💵 Cost: $${cost.toFixed(6)}`);
      console.log(`   🎯 Tokens: ${tokens} (prompt: ${response.usage?.prompt_tokens}, completion: ${response.usage?.completion_tokens})`);
      console.log(`   📝 Response: "${response.choices[0].message.content.substring(0, 80)}..."`);
      
    } catch (error) {
      console.log(`❌ Request ${index + 1} failed: ${error.message}`);
      console.log(`💡 Failed requests don't contribute to cost but affect success rate`);
    }
    
    // Brief delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 600));
  }
  
  const totalDuration = Date.now() - startTime;
  
  console.log('\\n📈 --- Batch Analytics Summary ---');
  console.log('=====================================');
  console.log(`✅ Successful Requests: ${successfulRequests}/${requests.length} (${Math.round(successfulRequests/requests.length*100)}%)`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(6)}`);
  console.log(`🎯 Total Tokens: ${totalTokens.toLocaleString()}`);
  console.log(`⚡ Average Cost per Request: $${(totalCost / successfulRequests).toFixed(6)}`);
  console.log(`📊 Average Tokens per Request: ${Math.round(totalTokens / successfulRequests)}`);
  console.log(`⏱️  Total Processing Time: ${(totalDuration/1000).toFixed(1)}s`);
  console.log(`🚀 Average Request Time: ${Math.round(totalDuration / requests.length)}ms`);
  
  // Cost projections
  const costPer1k = (totalCost / successfulRequests) * 1000;
  const costPer10k = costPer1k * 10;
  
  console.log('\\n🔮 --- Cost Projections ---');
  console.log(`📈 Estimated cost for 1,000 similar requests: $${costPer1k.toFixed(2)}`);
  console.log(`📈 Estimated cost for 10,000 similar requests: $${costPer10k.toFixed(2)}`);
}

/**
 * Demonstrates concurrent request handling and rate limiting
 */
async function concurrentRequestExample() {
  console.log('\\n🚀 --- Concurrent Request Example ---');
  
  const concurrentRequests = 3;
  const prompts = [
    'Count to 3',
    'Say hello',
    'What is 2+2?',
  ];
  
  console.log(`⚡ Executing ${concurrentRequests} requests concurrently...`);
  const startTime = Date.now();
  
  try {
    const promises = prompts.map((prompt, index) => 
      openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        metadata: {
          concurrentBatch: 'demo_batch',
          requestIndex: index.toString(),
          testType: 'concurrent_requests',
        }
      })
    );
    
    const responses = await Promise.all(promises);
    const totalDuration = Date.now() - startTime;
    
    console.log(`✅ All ${concurrentRequests} requests completed in ${totalDuration}ms`);
    
    responses.forEach((response, index) => {
      console.log(`📝 Request ${index + 1}: "${response.choices[0].message.content.trim()}"`);
    });
    
    console.log(`💡 Concurrent execution is much faster than sequential for multiple requests`);
    
  } catch (error) {
    console.error('❌ Concurrent request failed:', error.message);
  }
}

/**
 * Run all advanced examples in sequence
 */
async function runAdvancedExamples() {
  console.log('🎯 Tokenlay SDK - Advanced Features Examples');
  console.log('==========================================');
  console.log('🚀 Demonstrating production-ready patterns and best practices');
  console.log('');
  
  const examples = [
    { name: 'Health Checks', fn: healthCheckExample },
    { name: 'Error Handling', fn: errorHandlingExample },
    { name: 'Provider Switching', fn: providerSwitchingExample },
    { name: 'Key Rotation', fn: keyRotationExample },
    { name: 'Cost Tracking', fn: costTrackingExample },
    { name: 'Concurrent Requests', fn: concurrentRequestExample },
  ];
  
  for (const example of examples) {
    try {
      await example.fn();
      console.log(`\\n✅ ${example.name} example completed`);
    } catch (error) {
      console.error(`\\n❌ ${example.name} example failed:`, error.message);
    }
    
    // Brief pause between examples
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\\n🎉 All advanced examples completed!');
  console.log('\\n📚 Key Takeaways:');
  console.log('   • Always implement proper error handling and retries');
  console.log('   • Use multiple providers for redundancy and cost optimization');
  console.log('   • Monitor costs and usage to stay within budgets');
  console.log('   • Implement health checks for production monitoring');
  console.log('   • Consider concurrent requests for better performance');
  console.log('   • Plan for API key rotation and security best practices');
}

// Run all examples
runAdvancedExamples().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});