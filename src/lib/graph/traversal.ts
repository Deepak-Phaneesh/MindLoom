import { CanvasNodeData, CanvasEdgeData, TraversalResult, TraversalHop } from './types';
import { Node, Edge } from '@xyflow/react';

interface AdjacencyEdge {
  targetId: string;
  edgeId: string;
  relation: string;
  label?: string;
  explanation?: string;
}

export class GraphTraversalEngine {
  private adjacencyList: Map<string, AdjacencyEdge[]> = new Map();
  private reverseAdjacencyList: Map<string, AdjacencyEdge[]> = new Map();
  private nodeMap: Map<string, Node<CanvasNodeData>> = new Map();
  private edgeMap: Map<string, Edge<CanvasEdgeData>> = new Map();

  constructor(nodes: Node<CanvasNodeData>[], edges: Edge<CanvasEdgeData>[]) {
    this.buildGraph(nodes, edges);
  }

  private buildGraph(nodes: Node<CanvasNodeData>[], edges: Edge<CanvasEdgeData>[]) {
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.nodeMap.clear();
    this.edgeMap.clear();

    nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    });

    edges.forEach((edge) => {
      this.edgeMap.set(edge.id, edge);
      const relation = edge.data?.relation || 'relates_to';
      const label = edge.data?.label || relation;
      const explanation = edge.data?.explanation || '';

      const forwardList = this.adjacencyList.get(edge.source);
      if (forwardList) {
        forwardList.push({
          targetId: edge.target,
          edgeId: edge.id,
          relation,
          label,
          explanation,
        });
      }

      // Graph is treated as directed for relationships, but we track reverse for bidirectional queries
      const reverseList = this.reverseAdjacencyList.get(edge.target);
      if (reverseList) {
        reverseList.push({
          targetId: edge.source,
          edgeId: edge.id,
          relation: `(incoming) ${relation}`,
          label,
          explanation,
        });
      }
    });
  }

  /**
   * Finds the shortest multi-hop path between two nodes using Breadth-First Search (BFS).
   * Supports undirected or directed exploration.
   */
  public findShortestPath(sourceId: string, targetId: string, allowUndirected = true): TraversalResult {
    if (!this.nodeMap.has(sourceId) || !this.nodeMap.has(targetId)) {
      return {
        found: false,
        path: [],
        totalHops: 0,
        summary: 'One or both of the selected nodes do not exist in the graph.',
      };
    }

    if (sourceId === targetId) {
      const node = this.nodeMap.get(sourceId)!;
      return {
        found: true,
        path: [
          {
            nodeId: sourceId,
            nodeTitle: node.data.title,
            nodeType: node.data.nodeType,
          },
        ],
        totalHops: 0,
        summary: 'Source and target are the same node.',
      };
    }

    const queue: Array<{ currentId: string; path: TraversalHop[] }> = [];
    const visited = new Set<string>();

    const startNode = this.nodeMap.get(sourceId)!;
    queue.push({
      currentId: sourceId,
      path: [
        {
          nodeId: sourceId,
          nodeTitle: startNode.data.title,
          nodeType: startNode.data.nodeType,
        },
      ],
    });
    visited.add(sourceId);

    while (queue.length > 0) {
      const { currentId, path } = queue.shift()!;

      if (currentId === targetId) {
        const summary = this.generatePathNarrative(path);
        return {
          found: true,
          path,
          totalHops: path.length - 1,
          summary,
        };
      }

      // Outgoing edges
      const outgoing = this.adjacencyList.get(currentId) || [];
      for (const edge of outgoing) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          const nextNode = this.nodeMap.get(edge.targetId);
          if (nextNode) {
            queue.push({
              currentId: edge.targetId,
              path: [
                ...path,
                {
                  nodeId: edge.targetId,
                  nodeTitle: nextNode.data.title,
                  nodeType: nextNode.data.nodeType,
                  edgeLabel: edge.label,
                  explanation: edge.explanation,
                },
              ],
            });
          }
        }
      }

      // If undirected path discovery is allowed, also follow reverse edges
      if (allowUndirected) {
        const incoming = this.reverseAdjacencyList.get(currentId) || [];
        for (const edge of incoming) {
          if (!visited.has(edge.targetId)) {
            visited.add(edge.targetId);
            const nextNode = this.nodeMap.get(edge.targetId);
            if (nextNode) {
              queue.push({
                currentId: edge.targetId,
                path: [
                  ...path,
                  {
                    nodeId: edge.targetId,
                    nodeTitle: nextNode.data.title,
                    nodeType: nextNode.data.nodeType,
                    edgeLabel: `connected via ${edge.label}`,
                    explanation: edge.explanation,
                  },
                ],
              });
            }
          }
        }
      }
    }

    return {
      found: false,
      path: [],
      totalHops: 0,
      summary: `No relationship path discovered between "${this.nodeMap.get(sourceId)?.data.title}" and "${this.nodeMap.get(targetId)?.data.title}".`,
    };
  }

  private generatePathNarrative(path: TraversalHop[]): string {
    if (path.length <= 1) return 'Direct node match.';
    const steps: string[] = [];

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const relation = curr.edgeLabel || 'relates to';
      steps.push(`**${prev.nodeTitle}** [${relation}] ➔ **${curr.nodeTitle}**`);
    }

    return steps.join(' ➔ ');
  }

  /**
   * Graph metrics calculation: Centrality, Degree counts, Density
   */
  public computeMetrics() {
    const totalNodes = this.nodeMap.size;
    const totalEdges = this.edgeMap.size;
    const degrees: Record<string, { in: number; out: number; total: number }> = {};

    this.nodeMap.forEach((_, id) => {
      const outDeg = (this.adjacencyList.get(id) || []).length;
      const inDeg = (this.reverseAdjacencyList.get(id) || []).length;
      degrees[id] = { in: inDeg, out: outDeg, total: inDeg + outDeg };
    });

    // Find highest centrality node
    let topNodeId = '';
    let maxDegree = -1;
    for (const [id, deg] of Object.entries(degrees)) {
      if (deg.total > maxDegree) {
        maxDegree = deg.total;
        topNodeId = id;
      }
    }

    const maxPossibleEdges = totalNodes > 1 ? totalNodes * (totalNodes - 1) : 1;
    const density = totalNodes > 1 ? Number((totalEdges / maxPossibleEdges).toFixed(3)) : 0;

    return {
      totalNodes,
      totalEdges,
      density,
      degrees,
      mostConnectedNode: topNodeId ? {
        id: topNodeId,
        title: this.nodeMap.get(topNodeId)?.data.title || '',
        connections: maxDegree,
      } : null,
    };
  }
}
