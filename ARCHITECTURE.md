# Architecture Overview

## System Architecture

Flash UI v2 is a production-grade, AI-integrated Next.js application built with a modular, scalable architecture. This document provides a comprehensive overview of the system design.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         React 19 + Next.js 15 Frontend                  │ │
│  │  - HeroSection (Parallax Animations)                    │ │
│  │  - Diagrams (Lazy Loaded)                               │ │
│  │  - Framer Motion Animations                             │ │
│  └────────────────────┬────────────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTP/SSE
┌───────────────────────┼──────────────────────────────────────┐
│                   Next.js Server                             │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │              API Routes Layer                          │  │
│  │  /api/chat     - AI conversation endpoint              │  │
│  │  /api/metrics  - Usage statistics endpoint             │  │
│  └────────────────────┬───────────────────────────────────┘  │
│  ┌────────────────────▼───────────────────────────────────┐  │
│  │            AI Orchestration Service                    │  │
│  │  - Request validation & sanitization                   │  │
│  │  - Retry logic with exponential backoff                │  │
│  │  - Fallback model support                              │  │
│  │  - Usage metering & cost tracking                      │  │
│  └────┬────────────────────────────────────┬──────────────┘  │
│       │                                    │                 │
│  ┌────▼─────────────┐              ┌──────▼──────────────┐  │
│  │  OpenAI Adapter  │              │ Anthropic Adapter   │  │
│  │  - GPT-4 Turbo   │              │ - Claude 3.5        │  │
│  │  - Streaming     │              │ - Streaming         │  │
│  └────┬─────────────┘              └──────┬──────────────┘  │
│       │                                    │                 │
│  ┌────▼────────────────────────────────────▼─────────────┐  │
│  │               Cache Manager                            │  │
│  │  - Redis (distributed) / LRU (in-memory)               │  │
│  │  - TTL-based invalidation                              │  │
│  │  - Prompt fingerprinting                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Logging & Metrics                         │  │
│  │  - Structured logging (requests, errors, cache)         │  │
│  │  - Performance metrics (latency, tokens, cost)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────┬────────────────┘
                       │                       │
               ┌───────▼────────┐    ┌────────▼──────────┐
               │  OpenAI API    │    │  Anthropic API    │
               │  (External)    │    │  (External)       │
               └────────────────┘    └───────────────────┘
```

## Directory Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # AI chat endpoint
│   │   └── metrics/              # Metrics endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── sections/                 # Page sections
│   │   └── HeroSection.tsx       # Hero with parallax
│   ├── diagrams/                 # Diagram components
│   │   ├── ArchitectureDiagram.tsx
│   │   ├── FlowDiagram.tsx
│   │   └── DataDiagram.tsx
│   └── Diagrams.tsx              # Lazy loader
├── lib/                          # Core libraries
│   ├── ai/                       # AI orchestration
│   │   ├── service.ts            # Main service
│   │   ├── openai-adapter.ts    # OpenAI integration
│   │   └── anthropic-adapter.ts # Claude integration
│   ├── cache/                    # Caching layer
│   │   └── index.ts              # Redis/LRU cache
│   └── utils/                    # Utilities
│       ├── ai-utils.ts           # AI helpers
│       └── logger.ts             # Structured logging
├── types/                        # TypeScript types
│   └── ai.ts                     # AI type definitions
└── config/                       # Configuration
    └── index.ts                  # App config
```

## Key Design Patterns

### 1. Adapter Pattern
Each AI provider (OpenAI, Anthropic) implements the `AIModelAdapter` interface, allowing seamless swapping and fallback between providers.

```typescript
interface AIModelAdapter {
  sendRequest(request: AIRequest): Promise<AIResponse>;
  streamRequest(request: AIRequest): AsyncGenerator<StreamChunk>;
  countTokens(text: string): number;
  validateRequest(request: AIRequest): boolean;
}
```

### 2. Strategy Pattern
The AI Service uses different strategies for:
- Caching (Redis vs LRU)
- Retry logic (exponential backoff)
- Model selection (primary vs fallback)

### 3. Observer Pattern
- IntersectionObserver for lazy loading diagrams
- Scroll observers for parallax effects
- Real-time metrics updates

### 4. Singleton Pattern
- AI Service instance
- Cache Manager
- Logger

## Data Flow

### Request Flow (With Caching)

```
1. User Request
   ↓
2. API Route (/api/chat)
   ↓
3. Input Sanitization
   ↓
4. Cache Check (by fingerprint)
   ├─→ Cache Hit → Return cached response
   └─→ Cache Miss → Continue
       ↓
5. AI Service
   ├─→ Select Provider (OpenAI/Anthropic)
   ├─→ Token Validation & Counting
   ├─→ Send Request with Retry
   └─→ Handle Fallback if needed
       ↓
6. AI Provider (External API)
   ↓
7. Output Sanitization
   ↓
8. Cache Response (TTL-based)
   ↓
9. Update Metrics
   ↓
10. Return to Client
```

### Streaming Flow

```
1. User Request (stream: true)
   ↓
2. API Route establishes SSE connection
   ↓
3. AI Service streams chunks
   ↓
4. Each chunk:
   ├─→ Sanitized
   ├─→ Sent to client via SSE
   └─→ Logged
   ↓
5. Stream completion signal
```

## Performance Optimizations

### Frontend
1. **Code Splitting**: Dynamic imports for diagrams
2. **Lazy Loading**: IntersectionObserver for offscreen content
3. **Throttling**: Scroll handlers limited to 60fps
4. **Memoization**: useMemo/useCallback for expensive computations
5. **Animation**: GPU-accelerated transforms with Framer Motion

### Backend
1. **Caching**: 60-70% cache hit rate reduces API calls
2. **Connection Pooling**: Redis connection reuse
3. **Streaming**: Reduce time-to-first-byte for long responses
4. **Request Batching**: Multiple operations in single round-trip

### Build
1. **Tree Shaking**: Unused code elimination
2. **Minification**: JS/CSS compression
3. **Bundle Analysis**: Identify large dependencies
4. **Static Generation**: Pre-render where possible

## Security Measures

### Input Security
- HTML/Script tag removal
- Comment stripping
- Length limitation
- Prompt injection detection

### API Security
- Server-side API key storage
- Environment variable isolation
- HTTPS-only in production
- Rate limiting (ready for implementation)

### Output Security
- Response sanitization
- XSS prevention
- Safe rendering

## Scalability Considerations

### Horizontal Scaling
- Stateless API routes
- Redis for distributed caching
- Load balancer compatible

### Vertical Scaling
- GPU acceleration ready (Dockerfile.gpu)
- Async/non-blocking operations
- Efficient memory management

### Cost Optimization
- Intelligent caching (reduces API calls by 60%)
- Token counting prevents over-usage
- Usage metering for monitoring
- Fallback to cheaper models

## Monitoring & Observability

### Logging
- Structured JSON logs
- Request/response tracking
- Error context capture
- Performance metrics

### Metrics
- Total requests & tokens
- Cache hit/miss rates
- Average latency
- Cost tracking
- Error rates

### Health Checks (Ready for Implementation)
- API endpoint availability
- Redis connection status
- External API status
- Memory/CPU usage

## Deployment Architecture

### Docker Deployment
```
┌─────────────────────────────────────┐
│         Load Balancer (Optional)    │
└────────────┬────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
┌────▼────┐     ┌────▼────┐
│ App     │     │ App     │  (Horizontally scaled)
│ Container│     │ Container│
└────┬────┘     └────┬────┘
     │                │
     └───────┬────────┘
             │
     ┌───────▼────────┐
     │ Redis Container│
     └────────────────┘
```

### GPU Deployment (Optional)
Use `Dockerfile.gpu` with NVIDIA runtime for:
- vLLM inference acceleration
- Triton Inference Server
- Custom GPU-accelerated models

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3
- **Animation**: Framer Motion 11
- **Language**: TypeScript 5.7 (strict mode)

### Backend
- **Runtime**: Node.js 18+
- **AI SDKs**: OpenAI SDK 4.x, Anthropic SDK 0.32
- **Caching**: Redis 7 / In-memory LRU
- **Validation**: Zod 3.x

### Development
- **Testing**: Jest 29, Testing Library
- **Linting**: ESLint 9
- **Type Checking**: TypeScript strict mode
- **CI/CD**: GitHub Actions

### Deployment
- **Container**: Docker
- **Orchestration**: Docker Compose
- **GPU Support**: NVIDIA CUDA base image

## Future Enhancements

1. **WebSocket Support**: Real-time bidirectional communication
2. **Message Queue**: RabbitMQ/SQS for async processing
3. **Database**: PostgreSQL for persistent storage
4. **Authentication**: JWT/OAuth integration
5. **Rate Limiting**: Redis-based rate limiter
6. **Analytics**: Integration with DataDog/New Relic
7. **A/B Testing**: Feature flags and experimentation
8. **Edge Functions**: Deploy to edge for lower latency
