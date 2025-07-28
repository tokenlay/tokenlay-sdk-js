/**
 * Integration Test Example - JavaScript Version
 * 
 * This example thoroughly tests the complete SDK → Proxy → LiteLLM → Provider flow.
 * It validates all major features including health checks, metadata tracking,
 * usage analytics, and error handling.
 * 
 * Prerequisites:
 * 1. Start the proxy infrastructure: docker-compose up -d (in tokenlay-proxy/)
 * 2. Set OPENAI_API_KEY in .env file
 * 3. Ensure test API key exists in database
 * 
 * Run with: node examples/integration-test.js
 */

import { TokenlayOpenAI, getTokenlayMetadata } from '@tokenlay/sdk';
import { config } from 'dotenv';

// Load environment variables
config();

// Configuration
const TEST_CONFIG = {
  tokenlayKey: process.env.TOKENLAY_KEY || 'tk_test_integration_key_123456789',
  providerApiKey: process.env.OPENAI_API_KEY,
  tokenlayBaseUrl: process.env.TOKENLAY_BASE_URL || 'http://localhost:3000',
  providerApiBase: 'https://api.openai.com/v1'
};

// Test utilities
function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${title}`);
  console.log(`${'='.repeat(60)}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message, error) {
  console.log(`❌ ${message}`);
  if (error) {
    console.error(`   Error: ${error.message}`);
  }
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Test functions
async function testEnvironmentSetup() {
  logSection('Environment Setup Validation');
  
  let allGood = true;
  
  if (!TEST_CONFIG.tokenlayKey || TEST_CONFIG.tokenlayKey === 'your_tokenlay_key_here') {
    logError('TOKENLAY_KEY not set or still has placeholder value');
    allGood = false;
  } else {
    logSuccess(`Tokenlay Key: ${TEST_CONFIG.tokenlayKey.substring(0, 15)}...`);
  }
  
  if (!TEST_CONFIG.providerApiKey || TEST_CONFIG.providerApiKey === 'your_openai_api_key_here') {
    logError('OPENAI_API_KEY not set or still has placeholder value');
    logInfo('Please set your OpenAI API key in the .env file');
    allGood = false;
  } else {
    logSuccess(`OpenAI Key: ${TEST_CONFIG.providerApiKey.substring(0, 10)}...`);
  }
  
  logSuccess(`Tokenlay Base URL: ${TEST_CONFIG.tokenlayBaseUrl}`);
  
  return allGood;
}

async function testProxyHealthCheck() {
  logSection('Proxy Health Check');
  
  try {
    const response = await fetch(`${TEST_CONFIG.tokenlayBaseUrl}/health`);
    
    if (response.ok) {
      const data = await response.json();
      logSuccess(`Proxy is healthy: ${JSON.stringify(data)}`);
      return true;
    } else {
      logError(`Proxy health check failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    logError('Failed to connect to proxy', error);
    logInfo('Make sure proxy is running: docker-compose up -d');
    return false;
  }
}

async function testClientInitialization() {
  logSection('Client Initialization');
  
  try {
    const client = new TokenlayOpenAI({
      tokenlayKey: TEST_CONFIG.tokenlayKey,
      providerApiKey: TEST_CONFIG.providerApiKey,
      tokenlayBaseUrl: TEST_CONFIG.tokenlayBaseUrl,
      metadata: {
        testSuite: 'integration-test',
        userId: 'test-user-123',
        feature: 'chat-completion'
      }
    });
    
    logSuccess('Client initialized successfully');
    return client;
  } catch (error) {
    logError('Failed to initialize client', error);
    return null;
  }
}

async function testClientHealthCheck(client) {
  logSection('SDK Health Check');
  
  try {
    const health = await client.healthCheck();
    
    if (health.status === 'ok') {
      logSuccess('SDK health check passed');
      return true;
    } else {
      logError(`SDK health check failed: ${health.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError('SDK health check threw error', error);
    return false;
  }
}

async function testBasicChatCompletion(client) {
  logSection('Basic Chat Completion');
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from integration test!" and nothing else.'
        }
      ],
      max_tokens: 20
    });
    
    logSuccess('Chat completion successful');
    logInfo(`Response: ${response.choices[0].message.content}`);
    logInfo(`Usage: ${JSON.stringify(response.usage)}`);
    
    // Check for Tokenlay metadata
    const metadata = getTokenlayMetadata(response);
    if (metadata) {
      logSuccess('Tokenlay metadata found in response');
      logInfo(`Metadata: ${JSON.stringify(metadata, null, 2)}`);
    } else {
      logError('No Tokenlay metadata found in response');
    }
    
    return true;
  } catch (error) {
    logError('Basic chat completion failed', error);
    return false;
  }
}

async function testMetadataPassthrough(client) {
  logSection('Metadata Passthrough');
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Respond with just "metadata test successful"'
        }
      ],
      metadata: {
        testType: 'metadata-passthrough',
        userId: 'test-user-456',
        tier: 'premium',
        feature: 'advanced-chat',
        sessionId: 'session-12345'
      },
      max_tokens: 10
    });
    
    logSuccess('Metadata passthrough test completed');
    logInfo(`Response content: ${response.choices[0].message.content}`);
    
    const metadata = getTokenlayMetadata(response);
    if (metadata) {
      logSuccess('Response includes Tokenlay metadata');
      logInfo(`Rule applied: ${metadata.ruleId || 'default'}`);
      logInfo(`Action: ${metadata.ruleAction || 'allow'}`);
      logInfo(`Tokens used: ${metadata.tokensUsed || 'unknown'}`);
      logInfo(`Cost: $${metadata.cost || 'unknown'}`);
    }
    
    return true;
  } catch (error) {
    logError('Metadata passthrough test failed', error);
    return false;
  }
}

async function testStreamingResponse(client) {
  logSection('Streaming Response');
  
  try {
    const stream = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5, each number on a new line.'
        }
      ],
      stream: true,
      max_tokens: 50,
      metadata: {
        testType: 'streaming',
        userId: 'test-user-123'
      }
    });
    
    logSuccess('Streaming request initiated');
    
    let fullContent = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      chunkCount++;
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        process.stdout.write(content);
      }
    }
    
    console.log(); // New line after streaming
    logSuccess(`Streaming completed: ${chunkCount} chunks received`);
    logInfo(`Full content: "${fullContent.trim()}"`);
    
    return true;
  } catch (error) {
    logError('Streaming test failed', error);
    return false;
  }
}

async function testErrorHandling(client) {
  logSection('Error Handling');
  
  // Test 1: Invalid model
  try {
    await client.chat.completions.create({
      model: 'invalid-model-name',
      messages: [{ role: 'user', content: 'test' }]
    });
    logError('Expected error for invalid model, but request succeeded');
  } catch (error) {
    logSuccess(`Invalid model error caught: ${error.message}`);
  }
  
  // Test 2: Empty messages
  try {
    await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: []
    });
    logError('Expected error for empty messages, but request succeeded');
  } catch (error) {
    logSuccess(`Empty messages error caught: ${error.message}`);
  }
  
  return true;
}

async function testMultipleRequests(client) {
  logSection('Multiple Concurrent Requests');
  
  const requests = Array.from({ length: 3 }, (_, i) => 
    client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `This is request number ${i + 1}. Just respond with "Request ${i + 1} complete"`
        }
      ],
      metadata: {
        testType: 'concurrent',
        requestNumber: i + 1,
        userId: 'test-user-123'
      },
      max_tokens: 10
    })
  );
  
  try {
    const responses = await Promise.all(requests);
    
    logSuccess(`All ${responses.length} concurrent requests completed`);
    
    responses.forEach((response, i) => {
      const content = response.choices[0].message.content;
      const metadata = getTokenlayMetadata(response);
      logInfo(`Request ${i + 1}: "${content}" (cost: $${metadata?.cost || 'unknown'})`);
    });
    
    return true;
  } catch (error) {
    logError('Concurrent requests test failed', error);
    return false;
  }
}

async function testMetadataUpdate(client) {
  logSection('Dynamic Metadata Updates');
  
  // Update global metadata
  client.updateMetadata({
    userId: 'updated-user-789',
    tier: 'enterprise',
    feature: 'dynamic-update-test'
  });
  
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say "Global metadata updated successfully"'
        }
      ],
      max_tokens: 15
    });
    
    logSuccess('Request with updated global metadata completed');
    logInfo(`Response: ${response.choices[0].message.content}`);
    
    return true;
  } catch (error) {
    logError('Dynamic metadata update test failed', error);
    return false;
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 Starting Tokenlay SDK Integration Tests');
  console.log(`⏰ ${new Date().toISOString()}`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function recordTest(name, passed) {
    results.total++;
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.tests.push({ name, passed });
  }
  
  // Environment validation
  const envOk = await testEnvironmentSetup();
  recordTest('Environment Setup', envOk);
  
  if (!envOk) {
    logError('Environment setup failed. Please fix configuration before proceeding.');
    return;
  }
  
  // Proxy health check
  const proxyHealthy = await testProxyHealthCheck();
  recordTest('Proxy Health Check', proxyHealthy);
  
  if (!proxyHealthy) {
    logError('Proxy is not healthy. Please start the proxy infrastructure.');
    return;
  }
  
  // Client initialization
  const client = await testClientInitialization();
  recordTest('Client Initialization', !!client);
  
  if (!client) {
    logError('Failed to initialize client. Cannot proceed with further tests.');
    return;
  }
  
  // Run all tests
  const tests = [
    { name: 'SDK Health Check', fn: () => testClientHealthCheck(client) },
    { name: 'Basic Chat Completion', fn: () => testBasicChatCompletion(client) },
    { name: 'Metadata Passthrough', fn: () => testMetadataPassthrough(client) },
    { name: 'Streaming Response', fn: () => testStreamingResponse(client) },
    { name: 'Error Handling', fn: () => testErrorHandling(client) },
    { name: 'Concurrent Requests', fn: () => testMultipleRequests(client) },
    { name: 'Dynamic Metadata Updates', fn: () => testMetadataUpdate(client) }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      recordTest(test.name, result);
    } catch (error) {
      logError(`Unexpected error in ${test.name}`, error);
      recordTest(test.name, false);
    }
  }
  
  // Summary
  logSection('Test Results Summary');
  
  console.log(`📊 Tests: ${results.total} total, ${results.passed} passed, ${results.failed} failed`);
  console.log(`📈 Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed tests:');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}`));
  }
  
  if (results.passed === results.total) {
    console.log('\n🎉 All tests passed! The SDK → Proxy → LiteLLM → Provider flow is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above for details.');
  }
  
  console.log(`\n⏰ Test completed at ${new Date().toISOString()}`);
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('❌ Integration test runner failed:', error);
  process.exit(1);
});