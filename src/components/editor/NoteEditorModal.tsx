'use client';

import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData, NodeType, ExtractedEntity, ExtractedRelation } from '@/lib/graph/types';
import { 
  X, 
  Sparkles, 
  Save, 
  Tag, 
  Layers, 
  Share2, 
  Check, 
  Loader2 
} from 'lucide-react';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<CanvasNodeData> | null;
  allNodes: Node<CanvasNodeData>[];
  onSaveNode: (updatedNode: Node<CanvasNodeData>, newNodes?: Node<CanvasNodeData>[], newEdges?: Edge<CanvasEdgeData>[]) => void;
}

export function NoteEditorModal({
  isOpen,
  onClose,
  node,
  allNodes,
  onSaveNode,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [nodeType, setNodeType] = useState<NodeType>('concept');
  const [tagsInput, setTagsInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntity[]>([]);
  const [extractedRelations, setExtractedRelations] = useState<ExtractedRelation[]>([]);
  const [autoLinkToCanvas, setAutoLinkToCanvas] = useState(true);

  useEffect(() => {
    if (node) {
      setTitle(node.data.title || '');
      setContent(node.data.content || '');
      setNodeType(node.data.nodeType || 'concept');
      setTagsInput((node.data.tags || []).join(', '));
      setExtractedEntities(node.data.entities || []);
      setExtractedRelations([]);
    } else {
      setTitle('');
      setContent('');
      setNodeType('concept');
      setTagsInput('');
      setExtractedEntities([]);
      setExtractedRelations([]);
    }
  }, [node]);

  if (!isOpen) return null;

  const handleRunAiExtraction = async () => {
    if (!title.trim() && !content.trim()) return;

    setIsExtracting(true);
    try {
      const existingTitles = allNodes
        .map((n) => n.data.title)
        .filter((t) => t && t.toLowerCase() !== title.toLowerCase());

      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          existingNodes: existingTitles,
        }),
      });

      if (!res.ok) throw new Error('Extraction request failed');
      const data = await res.json();

      setExtractedEntities(data.entities || []);
      setExtractedRelations(data.relationships || []);
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const targetNodeId = node ? node.id : `node-${Date.now()}`;
    const targetNodePosition = node ? node.position : { x: 300, y: 300 };

    const updatedNode: Node<CanvasNodeData> = {
      id: targetNodeId,
      type: 'knowledgeNode',
      position: targetNodePosition,
      data: {
        title: title.trim(),
        content: content.trim(),
        nodeType,
        tags,
        entities: extractedEntities,
        updatedAt: Date.now(),
      },
    };

    // If autoLinkToCanvas is enabled and new entities were extracted, dynamically create new nodes & edges
    const newNodesToAdd: Node<CanvasNodeData>[] = [];
    const newEdgesToAdd: Edge<CanvasEdgeData>[] = [];

    if (autoLinkToCanvas && extractedRelations.length > 0) {
      extractedRelations.forEach((rel, idx) => {
        // Check if target entity already exists in canvas
        let targetCanvasNode = allNodes.find(
          (n) => n.data.title.toLowerCase() === rel.target.toLowerCase()
        );

        if (!targetCanvasNode) {
          // Create new node for target entity
          const entityMeta = extractedEntities.find(
            (e) => e.name.toLowerCase() === rel.target.toLowerCase()
          );

          const newId = `node-ai-${Date.now()}-${idx}`;
          const angle = (idx / extractedRelations.length) * 2 * Math.PI;
          const radius = 280;

          const createdNode: Node<CanvasNodeData> = {
            id: newId,
            type: 'knowledgeNode',
            position: {
              x: targetNodePosition.x + Math.cos(angle) * radius,
              y: targetNodePosition.y + Math.sin(angle) * radius,
            },
            data: {
              title: rel.target,
              content: entityMeta?.description || rel.explanation || '',
              nodeType: entityMeta?.type || 'concept',
              tags: ['AI-Discovered'],
              updatedAt: Date.now(),
            },
          };

          newNodesToAdd.push(createdNode);
          targetCanvasNode = createdNode;
        }

        // Create edge
        newEdgesToAdd.push({
          id: `edge-${targetNodeId}-${targetCanvasNode.id}-${idx}`,
          source: targetNodeId,
          target: targetCanvasNode.id,
          type: 'relationEdge',
          data: {
            relation: rel.relation,
            label: rel.relation.replace('_', ' '),
            explanation: rel.explanation,
          },
        });
      });
    }

    onSaveNode(updatedNode, newNodesToAdd, newEdgesToAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {node ? 'Edit Knowledge Node' : 'Create New Knowledge Node'}
              </h2>
              <p className="text-xs text-slate-400">
                Write concept notes and trigger AI background extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Node Title / Subject
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus Engine"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Taxonomy Type
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as NodeType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="concept">Concept</option>
                <option value="service">Service</option>
                <option value="database">Database</option>
                <option value="api">API Endpoint</option>
                <option value="note">General Note</option>
                <option value="person">Person / Team</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Note Content & Architecture Details
              </label>
              <button
                type="button"
                onClick={handleRunAiExtraction}
                disabled={isExtracting || (!title.trim() && !content.trim())}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Extracting Knowledge...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Extract Entities & Relations
                  </>
                )}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write Markdown or architectural explanations. e.g. This service communicates with Redis for caching and persists graph queries to PostgreSQL..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Distributed, Real-time, Performance"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* AI Extracted Entities & Relations Preview */}
          {(extractedEntities.length > 0 || extractedRelations.length > 0) && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Knowledge Graph Discoveries
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLinkToCanvas}
                    onChange={(e) => setAutoLinkToCanvas(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  Auto-link edges and spawn nodes on Canvas
                </label>
              </div>

              {extractedEntities.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Extracted Entities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedEntities.map((ent, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {ent.name}{' '}
                        <span className="text-[10px] text-slate-400">({ent.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractedRelations.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Discovered Semantic Links:
                  </span>
                  <div className="space-y-1">
                    {extractedRelations.map((rel, i) => (
                      <div
                        key={i}
                        className="text-xs text-slate-300 flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/60"
                      >
                        <Share2 className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>
                          <strong>{rel.source}</strong> ➔{' '}
                          <span className="text-amber-300 font-mono text-[11px]">
                            [{rel.relation}]
                          </span>{' '}
                          ➔ <strong>{rel.target}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save & Update Graph
          </button>
        </div>
      </div>
    </div>
  );
}
