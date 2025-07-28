# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the JavaScript/TypeScript SDK for Tokenlay, an AI operations platform that provides intelligent routing, usage tracking, and cost control for LLM applications. The SDK acts as a drop-in replacement for the OpenAI SDK while routing requests through Tokenlay's proxy.

### Core Architecture

- **TokenlayOpenAI** (`src/client.ts`): Main client class that wraps the OpenAI SDK and routes requests through Tokenlay proxy
- **Types** (`src/types.ts`): TypeScript interfaces for configuration, metadata, and response types
- **Utils** (`src/utils.ts`): Helper functions for header manipulation, URL building, and validation
- **Index** (`src/index.ts`): Main entry point that exports the public API

The client maintains full OpenAI SDK compatibility while adding Tokenlay-specific features like metadata tracking, usage analytics, and cost control.

## Development Commands

### Building and Testing
```bash
npm run build          # Build the project using tsup
npm run dev            # Build in watch mode
npm run test           # Run tests with vitest
npm run test:ui        # Run tests with UI
npm run test:coverage  # Run tests with coverage report
```

### Code Quality
```bash
npm run lint           # Lint code with ESLint
npm run lint:fix       # Fix linting issues automatically
npm run typecheck      # Type check with TypeScript compiler
```

### Publishing
```bash
npm run prepublishOnly # Build, test, and typecheck before publishing
```

## Key Implementation Details

### Client Configuration
The TokenlayOpenAI client requires:
- `tokenlayKey`: Tokenlay API key for authentication
- `providerApiKey`: Underlying LLM provider API key (e.g., OpenAI)
- Optional: `providerApiBase`, `tokenlayBaseUrl`, `metadata`, `extraHeaders`

### Request Flow
1. Client wraps OpenAI SDK with Tokenlay proxy URL
2. Adds required headers: `x-tokenlay-provider-key`, `x-tokenlay-provider-base`
3. Converts metadata to prefixed headers (`x-tokenlay-*`)
4. Routes requests through Tokenlay proxy to actual provider
5. Returns standard OpenAI response with optional Tokenlay metadata

### Metadata System
- Global metadata set on client initialization
- Per-request metadata via `metadata` parameter
- All metadata converted to `x-tokenlay-*` headers
- Supports user tracking, feature attribution, and custom fields

## Testing Strategy

- Uses Vitest for testing with mocked OpenAI SDK
- Coverage reporting with v8 provider
- Tests cover client initialization, request routing, and metadata handling
- Mock responses include standard OpenAI format with Tokenlay extensions

## Build Configuration

- **tsup**: Builds both CommonJS and ESM formats with TypeScript declarations
- **External dependency**: OpenAI SDK (peer dependency)
- **Target**: ES2020 with tree-shaking enabled
- **Output**: `dist/` directory with `.js`, `.mjs`, and `.d.ts` files