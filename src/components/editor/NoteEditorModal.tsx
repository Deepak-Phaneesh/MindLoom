'use client';

import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData, NodeType, ExtractedEntity, ExtractedRelation } from '@/lib/graph/types';
import { 
  X, 
  Sparkles, 
  Save, 
  Layers, 
  Share2, 
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

    const newNodesToAdd: Node<CanvasNodeData>[] = [];
    const newEdgesToAdd: Edge<CanvasEdgeData>[] = [];

    if (autoLinkToCanvas && extractedRelations.length > 0) {
      extractedRelations.forEach((rel, idx) => {
        let targetCanvasNode = allNodes.find(
          (n) => n.data.title.toLowerCase() === rel.target.toLowerCase()
        );

        if (!targetCanvasNode) {
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
              tags: ['Discovered'],
              updatedAt: Date.now(),
            },
          };

          newNodesToAdd.push(createdNode);
          targetCanvasNode = createdNode;
        }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-obsidian-900 border border-white/[0.08] rounded-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-obsidian-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-champagne/10 text-champagne border border-champagne/20">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-[0.14em] uppercase text-[#f1ede6]">
                {node ? 'Edit Concept Node' : 'Initialize Knowledge Node'}
              </h2>
              <p className="text-[11px] font-sans text-[#8c867a]">
                Document components and run background knowledge relationship extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8c867a] hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a] mb-1">
                Node Title // Identifier
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus Engine"
                className="w-full px-3 py-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs font-mono text-[#f1ede6] placeholder:text-[#504c45] focus:outline-none focus:border-champagne/60"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a] mb-1">
                Taxonomy Type
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as NodeType)}
                className="w-full px-3 py-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs font-mono text-[#f1ede6] focus:outline-none focus:border-champagne/60"
              >
                <option value="concept">Concept (Core)</option>
                <option value="service">Service (System)</option>
                <option value="database">Database (Storage)</option>
                <option value="api">API Endpoint (Network)</option>
                <option value="note">General Note (Doc)</option>
                <option value="person">Person / Team (Auth)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a]">
                Architectural Content // Markdown
              </label>
              <button
                type="button"
                onClick={handleRunAiExtraction}
                disabled={isExtracting || (!title.trim() && !content.trim())}
                className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-champagne hover:text-champagne-300 transition-colors disabled:opacity-40"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Extracting Knowledge...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-champagne" />
                    Analyze Entities & Relations
                  </>
                )}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Explain how this node functions, its protocol dependencies, caches, and database integrations..."
              className="w-full px-3 py-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs font-mono text-[#f1ede6] placeholder:text-[#504c45] focus:outline-none focus:border-champagne/60 resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a] mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Real-time, WebSocket, High-Concurrency"
              className="w-full px-3 py-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs font-mono text-[#f1ede6] placeholder:text-[#504c45] focus:outline-none focus:border-champagne/60"
            />
          </div>

          {/* AI Extracted Discoveries Preview */}
          {(extractedEntities.length > 0 || extractedRelations.length > 0) && (
            <div className="p-3.5 rounded-lg bg-obsidian-950 border border-champagne/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-champagne uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-champagne" />
                  Extracted Discoveries
                </div>
                <label className="flex items-center gap-1.5 font-sans text-[11px] text-[#a6a094] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLinkToCanvas}
                    onChange={(e) => setAutoLinkToCanvas(e.target.checked)}
                    className="rounded border-white/10 bg-obsidian-950 text-champagne focus:ring-champagne/40"
                  />
                  Auto-spawn nodes & link on Canvas
                </label>
              </div>

              {extractedEntities.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8c867a] block mb-1">
                    Detected Entities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {extractedEntities.map((ent, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-obsidian-800 text-[#d8d2c6] border border-white/[0.06] flex items-center gap-1"
                      >
                        <span className="w-1 h-1 rounded-full bg-champagne" />
                        {ent.name}{' '}
                        <span className="text-[9px] text-[#8c867a]">({ent.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractedRelations.length > 0 && (
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#8c867a] block mb-1">
                    Semantic Connections:
                  </span>
                  <div className="space-y-1 font-mono text-[10px]">
                    {extractedRelations.map((rel, i) => (
                      <div
                        key={i}
                        className="text-[#d8d2c6] flex items-center gap-2 p-1.5 rounded bg-obsidian-900 border border-white/[0.04]"
                      >
                        <Share2 className="w-3 h-3 text-champagne shrink-0" />
                        <span>
                          <strong>{rel.source}</strong> ➔{' '}
                          <span className="text-champagne font-bold">[{rel.relation}]</span> ➔{' '}
                          <strong>{rel.target}</strong>
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
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-white/[0.06] bg-obsidian-950/40">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider font-semibold text-[#8c867a] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-champagne hover:bg-champagne-300 text-obsidian-950 font-mono text-[10px] font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(232,200,140,0.2)] disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Commit to Graph
          </button>
        </div>
      </div>
    </div>
  );
}
