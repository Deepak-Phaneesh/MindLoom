import { Node, Edge } from '@xyflow/react';
import * as d3Force from 'd3-force';
import { CanvasNodeData, CanvasEdgeData } from './types';

interface SimNode extends d3Force.SimulationNodeDatum {
  id: string;
  width?: number;
  height?: number;
}

interface SimLink extends d3Force.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

/**
 * Calculates physics-based positions for canvas nodes using d3-force.
 * Balances cluster cohesion with collision repulsion to produce clean, readable layouts.
 */
export function calculateForceLayout(
  nodes: Node<CanvasNodeData>[],
  edges: Edge<CanvasEdgeData>[],
  width = 1200,
  height = 800
): Node<CanvasNodeData>[] {
  if (nodes.length === 0) return [];

  // Deep clone nodes to avoid mutating during layout calculations
  const simNodes: SimNode[] = nodes.map((node) => ({
    id: node.id,
    x: node.position.x || width / 2 + (Math.random() - 0.5) * 200,
    y: node.position.y || height / 2 + (Math.random() - 0.5) * 200,
    width: node.measured?.width || 260,
    height: node.measured?.height || 180,
  }));

  const simLinks: SimLink[] = edges
    .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
    .map((e) => ({
      source: e.source,
      target: e.target,
    }));

  const simulation = d3Force
    .forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      d3Force
        .forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(240)
        .strength(0.6)
    )
    .force('charge', d3Force.forceManyBody().strength(-700))
    .force('center', d3Force.forceCenter(width / 2, height / 2))
    .force(
      'collision',
      d3Force.forceCollide().radius((d: any) => Math.max(d.width || 260, d.height || 180) / 1.6 + 40)
    )
    .stop();

  // Run iterations synchronously to compute the settled layout
  const iterations = Math.min(250, nodes.length * 20 + 80);
  for (let i = 0; i < iterations; ++i) {
    simulation.tick();
  }

  // Map coordinates back into the React Flow nodes array
  return nodes.map((node) => {
    const simNode = simNodes.find((sn) => sn.id === node.id);
    if (simNode && typeof simNode.x === 'number' && typeof simNode.y === 'number') {
      return {
        ...node,
        position: {
          x: Math.round(simNode.x),
          y: Math.round(simNode.y),
        },
      };
    }
    return node;
  });
}
