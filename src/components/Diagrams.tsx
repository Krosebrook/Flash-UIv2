'use client';

/**
 * Diagrams Component
 * Production-grade diagram rendering with:
 * - Lazy loading with React.lazy and Suspense
 * - IntersectionObserver for deferred loading
 * - Code splitting per diagram
 * - SSR-compatible fallbacks
 */

import { Suspense, lazy, useEffect, useRef, useState } from 'react';

// Lazy-loaded diagram components
const ArchitectureDiagram = lazy(() => import('./diagrams/ArchitectureDiagram'));
const FlowDiagram = lazy(() => import('./diagrams/FlowDiagram'));
const DataDiagram = lazy(() => import('./diagrams/DataDiagram'));

export interface DiagramProps {
  type: 'architecture' | 'flow' | 'data';
  title?: string;
  description?: string;
}

interface LazyDiagramProps extends DiagramProps {
  onVisible?: () => void;
}

/**
 * Fallback component for loading states
 */
function DiagramSkeleton({ title }: { title?: string }) {
  return (
    <div 
      className="w-full h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center"
      role="status"
      aria-label={`Loading ${title || 'diagram'}`}
    >
      <div className="text-gray-400 text-center">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p>Loading diagram...</p>
      </div>
    </div>
  );
}

/**
 * Error boundary fallback for diagram loading errors
 */
export function DiagramError({ title }: { title?: string }) {
  return (
    <div 
      className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center"
      role="alert"
      aria-label={`Error loading ${title || 'diagram'}`}
    >
      <div className="text-red-600 text-center">
        <svg 
          className="w-16 h-16 mx-auto mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <p className="font-semibold">Failed to load diagram</p>
        <p className="text-sm mt-2">Please refresh the page to try again</p>
      </div>
    </div>
  );
}

/**
 * Lazy diagram wrapper with IntersectionObserver
 */
function LazyDiagram({ type, title, description, onVisible }: LazyDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            onVisible?.();
          }
        });
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isVisible, onVisible]);

  return (
    <div ref={ref} className="min-h-[400px]">
      {isVisible ? (
        <Suspense fallback={<DiagramSkeleton title={title} />}>
          {type === 'architecture' && <ArchitectureDiagram title={title} description={description} />}
          {type === 'flow' && <FlowDiagram title={title} description={description} />}
          {type === 'data' && <DataDiagram title={title} description={description} />}
        </Suspense>
      ) : (
        <DiagramSkeleton title={title} />
      )}
    </div>
  );
}

/**
 * Main Diagrams component
 */
export default function Diagrams({ type, title, description }: DiagramProps) {
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const handleVisible = () => {
    const startTime = performance.now();
    // Use requestIdleCallback to measure load time without blocking
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        setLoadTime(performance.now() - startTime);
      });
    }
  };

  return (
    <div className="w-full">
      <LazyDiagram 
        type={type} 
        title={title} 
        description={description}
        onVisible={handleVisible}
      />
      
      {/* Performance metrics (dev only) */}
      {process.env.NODE_ENV === 'development' && loadTime && (
        <div className="mt-2 text-xs text-gray-500 font-mono">
          Loaded in {loadTime.toFixed(2)}ms
        </div>
      )}
    </div>
  );
}

/**
 * SSR-safe export with dynamic import
 */
export const DiagramsSSR = ({ type, title, description }: DiagramProps) => {
  // For SSR, render a placeholder
  if (typeof window === 'undefined') {
    return <DiagramSkeleton title={title} />;
  }

  return <Diagrams type={type} title={title} description={description} />;
};
