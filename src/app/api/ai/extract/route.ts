import { NextRequest, NextResponse } from 'next/server';
import { extractKnowledgeGraph } from '@/lib/ai/extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = 'Untitled Note', content = '', existingNodes = [] } = body;

    const result = await extractKnowledgeGraph(title, content, existingNodes);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/ai/extract error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to extract knowledge',
        entities: [],
        relationships: [],
      },
      { status: 500 }
    );
  }
}
