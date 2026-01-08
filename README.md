# Flash UI v2

[![CI/CD](https://github.com/Krosebrook/Flash-UIv2/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/Krosebrook/Flash-UIv2/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Production-grade AI-integrated React application with comprehensive Claude and OpenAI integration, advanced caching, performance optimization, and full observability.

## ✨ Key Features

- 🤖 **AI Orchestration**: Unified interface for OpenAI and Anthropic Claude with streaming support
- ⚡ **Smart Caching**: Redis-backed intelligent caching with LRU fallback (60-70% hit rate)
- 🔄 **Resilient**: Retry logic with exponential backoff and automatic model fallback
- 🎨 **Optimized UI**: Parallax animations, lazy loading, and code splitting
- 🔒 **Security First**: Input/output sanitization and prompt injection prevention
- 📊 **Full Observability**: Structured logging, metrics, and cost tracking
- 🧪 **Well Tested**: Comprehensive test coverage with Jest and Testing Library
- 🐳 **Docker Ready**: Standard and GPU-enabled Docker images
- 🚀 **CI/CD**: Automated testing, building, and security scanning

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your API keys
cp .env.example .env

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- [Full Documentation](DOCUMENTATION.md) - Complete API and usage guide
- [Production Checklist](PRODUCTION_OPTIMIZATION_CHECKLIST.md) - Deployment readiness
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **AI Providers**: OpenAI, Anthropic Claude
- **Caching**: Redis with LRU fallback
- **Testing**: Jest, Testing Library
- **CI/CD**: GitHub Actions
- **Containerization**: Docker with GPU support

## 📊 Performance

- Initial bundle: ~180KB (gzipped)
- Cache hit rate: 60-70%
- API response: <500ms (cached), <2s (uncached)
- First Contentful Paint: <1.5s

## 🔐 Security

- Server-side API key management
- Input/output sanitization
- Prompt injection prevention
- OWASP best practices

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ using AI Studio and modern web technologies</p>
  <a href="https://aistudio.google.com/apps">Start building with AI Studio</a>
</div>
