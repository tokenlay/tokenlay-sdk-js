/**
 * Metadata & User Tracking Example
 * 
 * This example demonstrates how to pass user context and metadata
 * to enable Tokenlay's intelligent routing and usage tracking.
 * 
 * Key concepts:
 * - Global metadata (applies to all requests)
 * - Per-request metadata (specific to each call)
 * - User tier-based routing
 * - Extracting Tokenlay response metadata
 * - Dynamic metadata updates
 * 
 * Run with: node examples/metadata.js
 */

import { TokenlayOpenAI, getTokenlayMetadata } from '@tokenlay/sdk';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

/**
 * Initialize client with global metadata
 * Global metadata applies to all requests from this client
 * @type {TokenlayOpenAI}
 */
const client = new TokenlayOpenAI({
  tokenlayKey: process.env.TOKENLAY_KEY,
  providerApiKey: process.env.OPENAI_API_KEY,
  // Global metadata - applies to every request
  metadata: {
    feature: 'chat_assistant',
    version: '1.0.0',
    environment: 'demo',
  }
});

/**
 * Demonstrates metadata usage with different user tiers
 * Shows how Tokenlay can route requests differently based on user context
 */
async function metadataExample() {
  try {
    console.log('🎯 Making requests with user metadata...');
    
    // Simulate different user types for tier-based routing
    const users = [
      { id: 'user_123', tier: 'free', name: 'Alice' },
      { id: 'user_456', tier: 'pro', name: 'Bob' },
      { id: 'user_789', tier: 'enterprise', name: 'Carol' },
    ];

    for (const user of users) {
      console.log(`\\n📋 --- Request for ${user.name} (${user.tier} tier) ---`);
      
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo', // May be overridden by Tokenlay rules based on tier
        messages: [
          {
            role: 'user',
            content: `Hi! I'm ${user.name}. Can you recommend a programming language to learn?`
          }
        ],
        // Per-request metadata - merged with global metadata
        metadata: {
          userId: user.id,
          tier: user.tier,
          sessionId: `session_${Date.now()}`,
          requestType: 'recommendation',
        }
      });

      console.log('✅ Response:', response.choices[0].message.content);
      console.log('📊 Usage:', response.usage);
      
      // Extract Tokenlay-specific metadata from the response
      // This shows which rules were applied and tracking information
      const tokenlayData = getTokenlayMetadata(response);
      if (tokenlayData) {
        console.log('🏷️  Tokenlay Metadata:');
        console.log('   - Rule Applied:', tokenlayData.ruleId || 'default');
        console.log('   - Action:', tokenlayData.ruleAction || 'allow');
        console.log('   - Cost: $' + (tokenlayData.cost?.toFixed(6) || 'unknown'));
        console.log('   - Tokens Used:', tokenlayData.tokensUsed || 'unknown');
        console.log('   - Model Used:', tokenlayData.model || response.model);
        
        if (tokenlayData.warnings?.length) {
          console.log('   ⚠️  Warnings:', tokenlayData.warnings);
        }
      } else {
        console.log('ℹ️  No Tokenlay metadata found in response');
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Error in metadata example:', error.message);
    if (error.response?.data) {
      console.error('🔍 Error details:', error.response.data);
    }
  }
}

/**
 * Demonstrates dynamic metadata updates
 * Shows how to change global metadata for different application contexts
 */
async function dynamicMetadataExample() {
  console.log('\\n🔄 --- Dynamic Metadata Update Example ---');
  
  try {
    // Update global metadata (applies to all future requests from this client)
    // This is useful for switching contexts within your application
    client.updateMetadata({
      userId: 'admin_user',
      tier: 'admin',
      feature: 'content_moderation',
      department: 'safety',
    });

    console.log('📝 Updated global metadata for admin context');

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Analyze this content for potential policy violations: "This is sample content for review"'
        }
      ],
      // Per-request metadata still works and merges with updated global metadata
      metadata: {
        contentId: 'content_123',
        reviewType: 'automated',
        priority: 'high',
      }
    });

    console.log('✅ Admin Response:', response.choices[0].message.content);
    
    const tokenlayData = getTokenlayMetadata(response);
    if (tokenlayData) {
      console.log('🏷️  Updated context metadata applied:', tokenlayData.ruleId || 'default');
    }
    
  } catch (error) {
    console.error('❌ Error in dynamic metadata example:', error.message);
  }
}

/**
 * Demonstrates feature-based tracking
 * Shows how to track usage by different application features
 */
async function featureTrackingExample() {
  console.log('\\n📈 --- Feature-Based Tracking Example ---');
  
  try {
    const features = ['chat', 'summarization', 'translation'];
    
    for (const feature of features) {
      console.log(`\\n🎯 Testing ${feature} feature...`);
      
      // Different prompts for different features
      const prompts = {
        chat: 'Hello! How are you today?',
        summarization: 'Summarize this in one sentence: Artificial intelligence is transforming many industries.',
        translation: 'Translate "Hello, world!" to Spanish.'
      };
      
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompts[feature] }],
        metadata: {
          feature: feature,
          userId: 'demo_user',
          tier: 'pro',
          timestamp: new Date().toISOString(),
        }
      });
      
      console.log(`✅ ${feature} result:`, response.choices[0].message.content);
      console.log(`📊 Tokens used: ${response.usage?.total_tokens || 'unknown'}`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
  } catch (error) {
    console.error('❌ Error in feature tracking example:', error.message);
  }
}

/**
 * Run all examples in sequence
 */
async function runExamples() {
  console.log('🎯 Tokenlay SDK - Metadata & User Tracking Examples');
  console.log('================================================');
  
  await metadataExample();
  await dynamicMetadataExample();
  await featureTrackingExample();
  
  console.log('\\n✅ All metadata examples completed!');
  console.log('💡 Check your Tokenlay dashboard to see how this usage is tracked and categorized.');
}

// Run the examples
runExamples().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});