/**
 * Basic Usage Example
 * 
 * This example shows the simplest way to use the Tokenlay SDK
 * as a drop-in replacement for the OpenAI SDK.
 * 
 * Run with: node examples/basic.js
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
  tokenlayKey: process.env.TOKENLAY_KEY,     // Get free key at https://tokenlay.com
  providerApiKey: process.env.OPENAI_API_KEY, // Your OpenAI API key
  // Optional: point to local proxy for development
  tokenlayBaseUrl: 'http://localhost:3000',
});

/**
 * Basic chat completion example
 */
async function basicExample() {
  try {
    console.log('🚀 Making a basic chat completion request...');
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Hello! Can you tell me a fun fact about TypeScript?'
        }
      ],
    });

    console.log('✅ Response:', response.choices[0].message.content);
    console.log('📊 Usage:', response.usage);
    
    // The response is identical to OpenAI's format
    // But routed through Tokenlay for intelligent routing and tracking
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Enhanced error details for debugging
    if (error.response?.data) {
      console.error('🔍 Error details:', error.response.data);
    }
    
    // Common error cases:
    if (error.message.includes('authentication')) {
      console.error('💡 Tip: Check your TOKENLAY_KEY and OPENAI_API_KEY in .env');
    } else if (error.message.includes('rate limit')) {
      console.error('💡 Tip: You may have hit rate limits. Try again in a moment.');
    }
  }
}

// Run the example
console.log('🎯 Tokenlay SDK - Basic Usage Example');
console.log('====================================');
basicExample();