/**
 * Chat API Route
 * Handles AI chat requests with streaming support
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';
import { AIRequest, ModelProvider } from '@/types/ai';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AIRequest & { provider?: ModelProvider };
    
    // Validate request
    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Handle streaming requests
    if (body.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of aiService.streamRequest(body, body.provider)) {
              const data = JSON.stringify(chunk);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              
              if (chunk.done) {
                controller.close();
              }
            }
          } catch (error) {
            logger.error('Stream error', { error });
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle regular requests
    const response = await aiService.sendRequest(body, body.provider);
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Chat API error', { error });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Chat API - Use POST to send messages',
      endpoints: {
        POST: '/api/chat',
        body: {
          messages: [{ role: 'user', content: 'Your message' }],
          model: 'gpt-4-turbo-preview (optional)',
          maxTokens: '4096 (optional)',
          temperature: '0.7 (optional)',
          stream: 'false (optional)',
          provider: 'openai | anthropic (optional)',
        }
      }
    }
  );
}
