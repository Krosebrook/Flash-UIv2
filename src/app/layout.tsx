import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flash UI - AI-Integrated Application',
  description: 'Production-grade AI-integrated React application with Claude and OpenAI',
  keywords: ['AI', 'React', 'Next.js', 'Claude', 'OpenAI', 'TypeScript'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
