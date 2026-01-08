import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
