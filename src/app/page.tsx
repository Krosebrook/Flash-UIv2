'use client';

import HeroSection from '@/components/sections/HeroSection';
import Diagrams from '@/components/Diagrams';

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection
        title="Flash UI v2"
        subtitle="Production-grade AI-integrated application with Claude and OpenAI"
        ctaText="Explore AI Features"
        onCtaClick={() => {
          document.getElementById('diagrams')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      
      <section id="diagrams" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
          System Overview
        </h2>
        
        <div className="space-y-12">
          <Diagrams
            type="architecture"
            title="System Architecture"
            description="Modular architecture with AI orchestration layer, caching, and monitoring"
          />
          
          <Diagrams
            type="flow"
            title="Request Flow"
            description="How requests are processed with caching and retry logic"
          />
          
          <Diagrams
            type="data"
            title="Data Processing Pipeline"
            description="Input sanitization, token management, and output validation"
          />
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    title: 'AI Orchestration',
    description: 'Unified interface for multiple AI providers with automatic fallback and retry logic',
    icon: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
  },
  {
    title: 'Smart Caching',
    description: 'Intelligent LRU and Redis caching with TTL-based invalidation',
    icon: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
  },
  {
    title: 'Streaming Responses',
    description: 'Real-time streaming for enhanced user experience',
    icon: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  },
  {
    title: 'Performance Optimized',
    description: 'Lazy loading, code splitting, and throttled scroll handlers',
    icon: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  },
  {
    title: 'Security First',
    description: 'Input/output sanitization and prompt injection prevention',
    icon: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  },
  {
    title: 'Full Observability',
    description: 'Structured logging, metrics, and usage tracking',
    icon: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
];
