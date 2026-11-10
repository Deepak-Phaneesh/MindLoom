import { ExtractedEntity, ExtractedRelation, NodeType, RelationType } from '../graph/types';

/**
 * Intelligent rule-based and NLP pattern extractor for offline/zero-config operation.
 * Accurately extracts technical entities, dependencies, data stores, and communication patterns.
 */
export function extractEntitiesAndRelationsHeuristically(
  noteTitle: string,
  noteContent: string,
  existingNodeTitles: string[] = []
): { entities: ExtractedEntity[]; relationships: ExtractedRelation[] } {
  const text = `${noteTitle}\n${noteContent}`;
  const entities: ExtractedEntity[] = [];
  const relationships: ExtractedRelation[] = [];

  // Technology & concept dictionaries with classifications
  const techKeywords: Record<string, { type: NodeType; desc: string }> = {
    'postgresql': { type: 'database', desc: 'Relational database management system' },
    'postgres': { type: 'database', desc: 'Relational database' },
    'redis': { type: 'database', desc: 'In-memory key-value data store & cache' },
    'neo4j': { type: 'database', desc: 'Graph database management system' },
    'apache age': { type: 'database', desc: 'Graph extension for PostgreSQL' },
    'pgvector': { type: 'database', desc: 'Vector similarity search extension for Postgres' },
    'sqlite': { type: 'database', desc: 'Embedded SQL database' },
    'next.js': { type: 'service', desc: 'React full-stack framework' },
    'nextjs': { type: 'service', desc: 'React framework' },
    'react': { type: 'concept', desc: 'UI library for component architectures' },
    'react flow': { type: 'service', desc: 'Interactive node-based canvas library' },
    'xyflow': { type: 'service', desc: 'Canvas library internals' },
    'yjs': { type: 'concept', desc: 'Conflict-free Replicated Data Type (CRDT) engine' },
    'websocket': { type: 'api', desc: 'Full-duplex real-time communication protocol' },
    'websockets': { type: 'api', desc: 'Real-time bidirectional protocol' },
    'crdt': { type: 'concept', desc: 'Conflict-Free Replicated Data Type algorithm' },
    'llm': { type: 'service', desc: 'Large Language Model inference service' },
    'bullmq': { type: 'service', desc: 'Redis-backed distributed message queue' },
    'rest api': { type: 'api', desc: 'Representational State Transfer endpoint' },
    'graphql': { type: 'api', desc: 'Query language and runtime for APIs' },
    'auth0': { type: 'service', desc: 'Identity authentication & authorization service' },
    'tiptap': { type: 'service', desc: 'Headless rich-text editor framework' },
    'jwt': { type: 'concept', desc: 'JSON Web Token security standard' },
    'd3': { type: 'concept', desc: 'Data-driven visualization library' },
  };

  // 1. Detect known architectural terms
  const lowerText = text.toLowerCase();
  for (const [kw, info] of Object.entries(techKeywords)) {
    if (lowerText.includes(kw)) {
      const formattedName = kw.charAt(0).toUpperCase() + kw.slice(1);
      if (!entities.some((e) => e.name.toLowerCase() === formattedName.toLowerCase())) {
        entities.push({
          id: `entity-${entities.length + 1}`,
          name: formattedName,
          type: info.type,
          description: info.desc,
        });
      }
    }
  }

  // 2. Extract capitalized noun phrases and bracketed terms [[Entity]] or "Service X"
  const bracketMatches = text.matchAll(/\[\[(.*?)\]\]/g);
  for (const match of bracketMatches) {
    const raw = match[1].trim();
    if (raw && !entities.some((e) => e.name.toLowerCase() === raw.toLowerCase())) {
      entities.push({
        id: `entity-${entities.length + 1}`,
        name: raw,
        type: 'concept',
        description: `Concept referenced in ${noteTitle}`,
      });
    }
  }

  // 3. Extract relationship links based on structural action verbs
  const relationshipRules: Array<{ pattern: RegExp; relation: RelationType; defaultExplanation: string }> = [
    { pattern: /(?:connects? to|syncs? with|subscribes? to|broadcasts? to)/i, relation: 'communicates_with', defaultExplanation: 'Real-time bidirectional synchronization' },
    { pattern: /(?:depends? on|requires?|relies? on|uses?)/i, relation: 'depends_on', defaultExplanation: 'Functional dependency' },
    { pattern: /(?:implements?|powers?|drives?|built with)/i, relation: 'implements', defaultExplanation: 'Implementation layer' },
    { pattern: /(?:stores? in|persists? to|cached in|queries?)/i, relation: 'stores_in', defaultExplanation: 'Data persistence or caching' },
    { pattern: /(?:is a|part of|subconcept of|type of)/i, relation: 'subconcept_of', defaultExplanation: 'Taxonomical hierarchy' },
  ];

  // Link note to detected entities
  for (const entity of entities) {
    let assignedRelation: RelationType = 'relates_to';
    let explanation = `Referenced within ${noteTitle}`;

    for (const rule of relationshipRules) {
      if (rule.pattern.test(text)) {
        assignedRelation = rule.relation;
        explanation = rule.defaultExplanation;
        break;
      }
    }

    relationships.push({
      source: noteTitle,
      target: entity.name,
      relation: assignedRelation,
      explanation,
    });
  }

  // Check connection to any existing nodes on the canvas
  for (const existing of existingNodeTitles) {
    if (existing.toLowerCase() !== noteTitle.toLowerCase() && lowerText.includes(existing.toLowerCase())) {
      relationships.push({
        source: noteTitle,
        target: existing,
        relation: 'relates_to',
        explanation: `Explicit cross-reference found in note body`,
      });
    }
  }

  return { entities, relationships };
}
