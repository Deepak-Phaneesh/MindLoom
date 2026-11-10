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
          const radius = 320;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: '#0f131a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0d13]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {node ? 'Edit Concept Node' : 'Create Knowledge Node'}
              </h2>
              <p className="text-xs text-slate-400">
                Document architecture and trigger automated relationship extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Node Title / Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus Engine"
                style={{ backgroundColor: '#141822', color: '#ffffff' }}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Taxonomy Type
              </label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as NodeType)}
                style={{ backgroundColor: '#141822', color: '#ffffff' }}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                <option value="concept">Concept</option>
                <option value="service">Service</option>
                <option value="database">Database</option>
                <option value="api">API Gateway</option>
                <option value="note">Documentation</option>
                <option value="person">Team / Auth</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Note Content (Markdown & Concepts)
              </label>
              <button
                type="button"
                onClick={handleRunAiExtraction}
                disabled={isExtracting || (!title.trim() && !content.trim())}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors disabled:opacity-40"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    Extracting Knowledge...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Run AI Entity Extraction
                  </>
                )}
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Describe what this component does, what it communicates with, what databases it queries..."
              style={{ backgroundColor: '#141822', color: '#ffffff' }}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 text-sm text-white placeholder-slate-500 leading-relaxed focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Real-time, High-Throughput, Distributed"
              style={{ backgroundColor: '#141822', color: '#ffffff' }}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* AI Extracted Discoveries Preview */}
          {(extractedEntities.length > 0 || extractedRelations.length > 0) && (
            <div 
              className="p-4 rounded-xl border border-amber-500/40 space-y-3"
              style={{ backgroundColor: '#141822' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Extracted Entities & Relationships
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLinkToCanvas}
                    onChange={(e) => setAutoLinkToCanvas(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
                  />
                  Auto-spawn nodes & link on canvas
                </label>
              </div>

              {extractedEntities.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1.5">
                    Detected Entities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedEntities.map((ent, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-white font-medium border border-slate-700 flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        {ent.name}{' '}
                        <span className="text-slate-400 text-[11px]">({ent.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractedRelations.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1.5">
                    Discovered Connections:
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {extractedRelations.map((rel, i) => (
                      <div
                        key={i}
                        className="text-slate-200 flex items-center gap-2 p-2 rounded-lg bg-[#0f131a] border border-slate-800 font-mono"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          <strong className="text-white">{rel.source}</strong> ➔{' '}
                          <span className="text-amber-400 font-bold">[{rel.relation}]</span> ➔{' '}
                          <strong className="text-white">{rel.target}</strong>
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0a0d13]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Save & Update Graph
          </button>
        </div>
      </div>
    </div>
  );
}
