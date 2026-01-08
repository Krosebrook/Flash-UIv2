'use client';

/**
 * HeroSection Component
 * Production-grade hero section with:
 * - Smooth parallax animation using framer-motion
 * - Responsive text scaling
 * - Throttled scroll listeners for performance
 * - Full ARIA accessibility support
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import throttle from 'lodash.throttle';

export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export default function HeroSection({
  title = 'Welcome to Flash UI',
  subtitle = 'Production-grade AI-integrated React applications',
  ctaText = 'Get Started',
  onCtaClick,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Framer motion scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Smooth spring animation for parallax
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform values for parallax effect
  const y = useTransform(smoothProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.8, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.1]);

  // Throttled scroll handler for additional custom logic
  const handleScroll = useMemo(
    () => throttle(() => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / rect.height));
      setScrollProgress(progress);
    }, 16), // ~60fps
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [handleScroll]);

  // Responsive text sizing
  const titleSize = useMemo(() => {
    if (typeof window === 'undefined') return 'text-5xl md:text-7xl';
    const width = window.innerWidth;
    if (width < 640) return 'text-4xl';
    if (width < 1024) return 'text-5xl';
    return 'text-7xl';
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCtaClick?.();
    }
  }, [onCtaClick]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary-900 to-primary-800"
      aria-label="Hero section"
    >
      {/* Parallax background layer */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y, scale }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(14,165,233,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      </motion.div>

      {/* Content layer */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ opacity }}
      >
        <motion.h1
          className={`${titleSize} font-bold text-white mb-6 leading-tight`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {title}
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {subtitle}
        </motion.p>

        {onCtaClick && (
          <motion.button
            className="px-8 py-4 bg-white text-primary-900 font-semibold rounded-lg shadow-lg hover:bg-primary-50 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary-300"
            onClick={onCtaClick}
            onKeyPress={handleKeyPress}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={ctaText}
            role="button"
            tabIndex={0}
          >
            {ctaText}
          </motion.button>
        )}

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: scrollProgress < 0.1 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          aria-hidden="true"
        >
          <motion.div
            className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div className="w-1 h-2 bg-white rounded-full" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-xs font-mono">
          Scroll: {Math.round(scrollProgress * 100)}%
        </div>
      )}
    </section>
  );
}
