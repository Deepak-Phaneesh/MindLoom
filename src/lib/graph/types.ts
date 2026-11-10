export type NodeType =
  | 'concept'
  | 'service'
  | 'database'
  | 'person'
  | 'api'
  | 'note';

export type RelationType =
  | 'depends_on'
  | 'communicates_with'
  | 'implements'
  | 'subconcept_of'
  | 'stores_in'
  | 'relates_to';

export interface ExtractedEntity {
  id: string;
  name: string;
  type: NodeType;
  description: string;
}

export interface ExtractedRelation {
  source: string;
  target: string;
  relation: RelationType;
  explanation: string;
  weight?: number;
}

export interface CanvasNodeData {
  title: string;
  content: string;
  nodeType: NodeType;
  tags: string[];
  entities?: ExtractedEntity[];
  color?: string;
  lastEditedBy?: string;
  updatedAt?: number;
  highlighted?: boolean;
  [key: string]: unknown;
}

export interface CanvasEdgeData {
  relation: RelationType;
  label?: string;
  explanation?: string;
  weight?: number;
  highlighted?: boolean;
  [key: string]: unknown;
}

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number } | null;
  selectedNodeId?: string | null;
  lastActive: number;
}

export interface TraversalHop {
  nodeId: string;
  nodeTitle: string;
  nodeType: NodeType;
  edgeLabel?: string;
  explanation?: string;
}

export interface TraversalResult {
  found: boolean;
  path: TraversalHop[];
  totalHops: number;
  summary: string;
}
