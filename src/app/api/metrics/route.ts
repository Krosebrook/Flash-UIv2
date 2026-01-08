/**
 * Metrics API Route
 * Returns usage metrics and statistics
 */

import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const metrics = aiService.getMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        cacheHitRate: metrics.totalRequests > 0 
          ? (metrics.cacheHits / metrics.totalRequests * 100).toFixed(2) + '%'
          : '0%',
        averageCost: metrics.totalRequests > 0
          ? (metrics.totalCost / metrics.totalRequests).toFixed(6)
          : '0',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    aiService.resetMetrics();
    
    return NextResponse.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
