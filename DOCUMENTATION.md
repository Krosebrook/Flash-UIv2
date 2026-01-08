# Flash UI v2 - Production-Grade AI-Integrated Application

A production-ready Next.js 14 application with comprehensive AI orchestration, featuring Claude and OpenAI integration, advanced caching, performance optimization, and full observability.

## 🚀 Features

### AI Orchestration Layer
- **Multi-Provider Support**: Unified interface for OpenAI and Anthropic Claude
- **Streaming Responses**: Real-time streaming for enhanced UX
- **Smart Caching**: Redis-backed intelligent caching with LRU fallback
- **Retry Logic**: Exponential backoff with automatic model fallback
- **Token Management**: Accurate counting, truncation, and validation
- **Cost Tracking**: Comprehensive usage metrics and cost estimation
- **Security**: Input/output sanitization and prompt injection prevention

### Frontend Components
- **HeroSection**: Optimized parallax animations with framer-motion
- **Diagrams**: Lazy-loaded with IntersectionObserver and SSR support
- **Accessibility**: Full ARIA support and keyboard navigation
- **Performance**: Code splitting, throttled handlers, requestIdleCallback

### Development & Production
- **TypeScript**: Strict mode with full type safety
- **Testing**: Jest + Testing Library with coverage reporting
- **CI/CD**: GitHub Actions with security scanning
- **Docker**: Standard and GPU-enabled images
- **Monitoring**: Structured logging and metrics

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+
- Redis (optional, falls back to in-memory LRU)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/Krosebrook/Flash-UIv2.git
cd Flash-UIv2

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys
# OPENAI_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here
```

## 🚦 Quick Start

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

### Docker
```bash
# Standard build
docker build -t flash-uiv2 .
docker run -p 3000:3000 --env-file .env flash-uiv2

# GPU-enabled build
docker build -f Dockerfile.gpu -t flash-uiv2:gpu .
docker run --gpus all -p 3000:3000 --env-file .env flash-uiv2:gpu
```

## 📚 Project Structure

```
Flash-UIv2/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # AI chat endpoint
│   │   │   └── metrics/       # Usage metrics endpoint
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── sections/          # Page sections
│   │   │   └── HeroSection.tsx
│   │   ├── diagrams/          # Diagram components
│   │   └── Diagrams.tsx       # Lazy-loaded diagrams
│   ├── lib/                   # Core libraries
│   │   ├── ai/               # AI orchestration
│   │   │   ├── service.ts    # Main AI service
│   │   │   ├── openai-adapter.ts
│   │   │   └── anthropic-adapter.ts
│   │   ├── cache/            # Caching layer
│   │   └── utils/            # Utility functions
│   ├── types/                # TypeScript types
│   ├── config/               # Configuration
│   └── hooks/                # Custom React hooks
├── .github/
│   └── workflows/            # CI/CD pipelines
├── Dockerfile                # Standard Docker image
├── Dockerfile.gpu            # GPU-enabled Docker image
└── PRODUCTION_OPTIMIZATION_CHECKLIST.md
```

## 🔌 API Endpoints

### POST /api/chat
Send messages to AI models with optional streaming.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "gpt-4-turbo-preview",
  "maxTokens": 4096,
  "temperature": 0.7,
  "stream": false,
  "provider": "openai"
}
```

**Response:**
```json
{
  "content": "Hello! How can I help you?",
  "model": "gpt-4-turbo-preview",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 8,
    "totalTokens": 18
  },
  "provider": "openai",
  "cached": false
}
```

### GET /api/metrics
Get usage statistics and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "totalTokens": 45000,
    "totalCost": 0.234,
    "cacheHits": 90,
    "cacheMisses": 60,
    "averageLatency": 850,
    "cacheHitRate": "60.00%"
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Performance

### Bundle Analysis
```bash
npm run analyze
```

### Key Metrics
- Initial JS Bundle: ~180KB (gzipped)
- Cache Hit Rate: 60-70% typical
- API Response: <500ms (cached), <2s (uncached)
- First Contentful Paint: <1.5s

## 🔒 Security

- **Input Sanitization**: All user inputs are sanitized before processing
- **Output Validation**: AI responses are validated and sanitized
- **Prompt Injection Prevention**: Multiple layers of protection
- **API Key Security**: Server-side only, never exposed to client
- **HTTPS Required**: All production deployments should use HTTPS

## 🌐 Deployment

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Optional
REDIS_URL=redis://localhost:6379
AI_ENABLE_CACHING=true
AI_CACHE_TTL=3600
ENABLE_LOGGING=true
```

### Production Checklist
- [ ] Set all required environment variables
- [ ] Configure Redis for distributed caching
- [ ] Enable HTTPS
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Run security audit
- [ ] Load test API endpoints

## 📈 Monitoring

The application includes structured logging and metrics:
- Request/response logging
- Cache hit/miss tracking
- Performance metrics (latency, token usage)
- Cost tracking per request
- Error tracking with context

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

See LICENSE file for details.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Framer Motion](https://www.framer.com/motion/)

## 📧 Support

For issues and questions, please open a GitHub issue.
