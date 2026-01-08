/**
 * Tests for HeroSection component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import HeroSection from '../sections/HeroSection';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useSpring: (value: any) => value,
}));

describe('HeroSection', () => {
  it('renders with default props', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Welcome to Flash UI/i)).toBeInTheDocument();
  });

  it('renders custom title and subtitle', () => {
    render(
      <HeroSection
        title="Custom Title"
        subtitle="Custom Subtitle"
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
  });

  it('renders CTA button when onCtaClick is provided', () => {
    const handleClick = jest.fn();
    render(
      <HeroSection
        ctaText="Click Me"
        onCtaClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button', { name: /Click Me/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onCtaClick when button is clicked', () => {
    const handleClick = jest.fn();
    render(
      <HeroSection
        onCtaClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard interaction on CTA button', () => {
    const handleClick = jest.fn();
    render(
      <HeroSection
        onCtaClick={handleClick}
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalled();
  });

  it('has proper ARIA labels', () => {
    render(<HeroSection onCtaClick={() => {}} />);
    
    const section = screen.getByRole('region', { name: /hero section/i });
    expect(section).toBeInTheDocument();
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('does not render CTA button when onCtaClick is not provided', () => {
    render(<HeroSection />);
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });
});
