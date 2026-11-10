import { GraphTraversalEngine } from '../src/lib/graph/traversal';
import { extractKnowledgeGraph } from '../src/lib/ai/extractor';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData } from '../src/lib/graph/types';

async function runVerificationTests() {
  console.log('🧪 Starting Core Engine Verification Tests...\n');

  // Test 1: AI Entity & Relation Extraction
  console.log('1. Testing AI Entity & Relation Extraction...');
  const sampleNote = {
    title: 'Authentication Microservice',
    content: 'This service implements JWT tokens, connects to Redis for session caching, and persists user credentials in PostgreSQL.',
  };
  const extraction = await extractKnowledgeGraph(sampleNote.title, sampleNote.content, ['Redis Cache', 'PostgreSQL']);
  console.log('   Extracted Entities:', extraction.entities.map((e) => `${e.name} (${e.type})`));
  console.log('   Extracted Relations:', extraction.relationships.map((r) => `${r.source} -> [${r.relation}] -> ${r.target}`));
  if (extraction.entities.length >= 2 && extraction.relationships.length >= 1) {
    console.log('   ✅ AI Extraction Test PASSED!\n');
  } else {
    throw new Error('AI Extraction Test Failed: Insufficient entities or relations');
  }

  // Test 2: Graph Traversal & Multi-Hop Path Discovery
  console.log('2. Testing Graph Traversal & Multi-Hop Shortest Path...');
  const testNodes: Node<CanvasNodeData>[] = [
    { id: 'A', position: { x: 0, y: 0 }, data: { title: 'Web App', content: '', nodeType: 'service', tags: [] } },
    { id: 'B', position: { x: 100, y: 0 }, data: { title: 'API Gateway', content: '', nodeType: 'api', tags: [] } },
    { id: 'C', position: { x: 200, y: 0 }, data: { title: 'Auth Service', content: '', nodeType: 'service', tags: [] } },
    { id: 'D', position: { x: 300, y: 0 }, data: { title: 'PostgreSQL DB', content: '', nodeType: 'database', tags: [] } },
  ];

  const testEdges: Edge<CanvasEdgeData>[] = [
    { id: 'e1', source: 'A', target: 'B', data: { relation: 'communicates_with', label: 'calls' } },
    { id: 'e2', source: 'B', target: 'C', data: { relation: 'depends_on', label: 'delegates to' } },
    { id: 'e3', source: 'C', target: 'D', data: { relation: 'stores_in', label: 'persists to' } },
  ];

  const engine = new GraphTraversalEngine(testNodes, testEdges);
  const pathResult = engine.findShortestPath('A', 'D', true);

  console.log('   Path Found:', pathResult.found);
  console.log('   Total Hops:', pathResult.totalHops);
  console.log('   Summary:', pathResult.summary);

  if (pathResult.found && pathResult.totalHops === 3) {
    console.log('   ✅ Multi-Hop Graph Traversal Test PASSED!\n');
  } else {
    throw new Error(`Graph Traversal Test Failed: Expected 3 hops, got ${pathResult.totalHops}`);
  }

  // Test 3: Graph Analytics Metrics
  console.log('3. Testing Graph Metrics Computation...');
  const metrics = engine.computeMetrics();
  console.log(`   Nodes: ${metrics.totalNodes}, Edges: ${metrics.totalEdges}, Density: ${metrics.density}`);
  if (metrics.totalNodes === 4 && metrics.totalEdges === 3) {
    console.log('   ✅ Graph Metrics Test PASSED!\n');
  } else {
    throw new Error('Graph Metrics Computation Failed');
  }

  console.log('🎉 ALL ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runVerificationTests().catch((err) => {
  console.error('❌ Verification test failed:', err);
  process.exit(1);
});
