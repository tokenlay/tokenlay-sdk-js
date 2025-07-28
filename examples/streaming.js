/**
 * Streaming Responses Example
 * 
 * This example demonstrates how to use streaming responses with the Tokenlay SDK.
 * Streaming works exactly the same as with the OpenAI SDK, providing real-time
 * token-by-token responses for better user experience.
 * 
 * Key features:
 * - Real-time streaming responses
 * - Identical to OpenAI SDK streaming API
 * - Metadata support with streaming
 * - Comparison with non-streaming requests
 * 
 * Run with: node examples/streaming.js
 */

import { TokenlayOpenAI } from '@tokenlay/sdk';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

/**
 * Initialize the Tokenlay client
 * @type {TokenlayOpenAI}
 */
const client = new TokenlayOpenAI({
  tokenlayKey: process.env.TOKENLAY_KEY,
  providerApiKey: process.env.OPENAI_API_KEY,
  // Optional: point to local proxy for development
  // tokenlayBaseUrl: 'http://localhost:3000',
});

/**
 * Demonstrates streaming chat completion
 * Shows real-time token-by-token response generation
 */
async function streamingExample() {
  try {
    console.log('🌊 Starting streaming chat completion...');
    console.log('⏳ Generating response in real-time...');
    
    const stream = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Tell me a short story about a robot who learns to paint. Make it engaging and creative!'
        }
      ],
      stream: true, // Enable streaming
      max_tokens: 200, // Limit response length for demo
      metadata: {
        userId: 'user_streaming_123',
        feature: 'storytelling',
        streamMode: 'enabled',
        requestType: 'creative_writing',
      }
    });

    console.log('\\n📖 --- Streaming Response ---');
    let fullResponse = '';
    let chunkCount = 0;
    const startTime = Date.now();
    
    // Process each chunk as it arrives
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        // Write directly to stdout for real-time display
        process.stdout.write(delta);
        fullResponse += delta;
        chunkCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log('\\n\\n✅ --- Stream Complete ---');
    console.log(`📊 Statistics:`);
    console.log(`   - Response length: ${fullResponse.length} characters`);
    console.log(`   - Chunks received: ${chunkCount}`);
    console.log(`   - Total time: ${duration}ms`);
    console.log(`   - Average chunk time: ${Math.round(duration / chunkCount)}ms`);
    
  } catch (error) {
    console.error('❌ Streaming error:', error.message);
    if (error.response?.data) {
      console.error('🔍 Error details:', error.response.data);
    }
  }
}

/**
 * Demonstrates non-streaming request for comparison
 * Shows the difference in user experience between streaming and batch responses
 */
async function nonStreamingComparison() {
  try {
    console.log('\\n🔄 --- Non-Streaming Comparison ---');
    console.log('⏳ Generating complete response (please wait)...');
    
    const startTime = Date.now();
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Write a haiku about programming and creativity.'
        }
      ],
      stream: false, // Explicit non-streaming (default behavior)
      metadata: {
        userId: 'user_batch_123',
        feature: 'poetry',
        streamMode: 'disabled',
        requestType: 'structured_writing',
      }
    });

    const duration = Date.now() - startTime;
    
    console.log('✅ Complete response:');
    console.log('   ', response.choices[0].message.content);
    console.log('\\n📊 Response stats:');
    console.log('   - Usage:', response.usage);
    console.log(`   - Total time: ${duration}ms`);
    console.log('   - Delivery: All at once (batch)');
    
  } catch (error) {
    console.error('❌ Non-streaming error:', error.message);
    if (error.response?.data) {
      console.error('🔍 Error details:', error.response.data);
    }
  }
}

/**
 * Demonstrates streaming with different message types
 * Shows how streaming works with various conversation patterns
 */
async function multiMessageStreamingExample() {
  console.log('\\n💬 --- Multi-Message Streaming Example ---');
  
  try {
    console.log('🎭 Simulating a conversation with context...');
    
    const stream = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful programming tutor. Explain concepts clearly and concisely.'
        },
        {
          role: 'user',
          content: 'What is the difference between async/await and Promises in JavaScript?'
        },
        {
          role: 'assistant',
          content: 'Great question! Both handle asynchronous operations, but in different ways...'
        },
        {
          role: 'user',
          content: 'Can you show me a simple example of each?'
        }
      ],
      stream: true,
      max_tokens: 150,
      metadata: {
        userId: 'student_456',
        feature: 'tutoring',
        subject: 'javascript',
        conversationId: 'conv_' + Date.now(),
      }
    });

    console.log('\\n🎓 --- Tutorial Response ---');
    let content = '';
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        process.stdout.write(delta);
        content += delta;
      }
    }
    
    console.log('\\n\\n✅ Tutorial response complete!');
    
  } catch (error) {
    console.error('❌ Multi-message streaming error:', error.message);
  }
}

/**
 * Run all streaming examples in sequence
 */
async function runExamples() {
  console.log('🎯 Tokenlay SDK - Streaming Responses Examples');
  console.log('============================================');
  console.log('💡 Streaming provides real-time responses for better UX');
  console.log('');
  
  await streamingExample();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
  
  await nonStreamingComparison();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
  
  await multiMessageStreamingExample();
  
  console.log('\\n🎉 All streaming examples completed!');
  console.log('\\n📝 Key takeaways:');
  console.log('   • Streaming provides real-time user feedback');
  console.log('   • Non-streaming is better for structured/batch processing');
  console.log('   • Both methods support full metadata tracking');
  console.log('   • API is identical to OpenAI SDK - just add stream: true');
}

// Run the examples
runExamples().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});