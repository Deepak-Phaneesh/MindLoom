import { NextRequest, NextResponse } from 'next/server';
import { GraphTraversalEngine } from '@/lib/graph/traversal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceId, targetId, nodes = [], edges = [], allowUndirected = true } = body;

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: 'sourceId and targetId are required' },
        { status: 400 }
      );
    }

    const engine = new GraphTraversalEngine(nodes, edges);
    const traversal = engine.findShortestPath(sourceId, targetId, allowUndirected);
    const metrics = engine.computeMetrics();

    return NextResponse.json({
      traversal,
      metrics,
    });
  } catch (error: any) {
    console.error('API /api/graph/traversal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to traverse graph' },
      { status: 500 }
    );
  }
}
