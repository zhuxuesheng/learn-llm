/**
 * Architecture Canvas Component
 * React Flow visualization of model architecture
 */

import { useCallback, useMemo } from 'react';
import type { NodeTypes, Node, Edge } from 'reactflow';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { ArchitectureGraph } from '../types';
import {
  CustomNode,
  InputNode,
  EmbeddingNode,
  DecoderNode,
  AttentionNode,
  MlpNode,
  MoeNode,
  NormNode,
  LmHeadNode,
  GroupNode,
  OutputNode,
} from './Nodes';

interface ArchitectureCanvasProps {
  graph: ArchitectureGraph;
  onNodeClick?: (nodeId: string) => void;
}

const customNodeTypes: NodeTypes = {
  input: InputNode,
  embedding: EmbeddingNode,
  decoder: DecoderNode,
  attention: AttentionNode,
  mlp: MlpNode,
  moe: MoeNode,
  norm: NormNode,
  lmhead: LmHeadNode,
  group: GroupNode,
  output: OutputNode,
  default: CustomNode,
};

const defaultEdgeStyle: React.CSSProperties = { stroke: '#475569', strokeWidth: 2 };

// Memoize nodeTypes and edgeTypes to avoid recreation on each render
const memoizedNodeTypes = customNodeTypes;

export function ArchitectureCanvas({
  graph,
  onNodeClick,
}: ArchitectureCanvasProps) {
  // Convert graph nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    return graph.nodes.map((node) => {
      // Calculate height for group/parent nodes based on their children
      let nodeStyle: React.CSSProperties | undefined;

      if (node.type === 'group') {
        // Find all children of this group node
        const children = graph.nodes.filter(n => n.parentNode === node.id);
        const maxY = children.length > 0
          ? Math.max(...children.map(c => c.position?.y ?? 0))
          : 0;
        // Estimate node height based on max child Y position + padding
        const estimatedHeight = maxY + 80;

        nodeStyle = {
          minWidth: '450px',
          minHeight: `${estimatedHeight}px`,
        };
      }

      return {
        id: node.id,
        type: node.type || 'default',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label,
          shape: node.data?.shape,
        },
        parentNode: node.parentNode,
        style: nodeStyle,
      };
    }) as Node[];
  }, [graph.nodes]);

  // Convert graph edges to React Flow edges
  const initialEdges = useMemo(() => {
    return graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      animated: edge.animated || false,
      style: edge.style || defaultEdgeStyle,
    })) as Edge[];
  }, [graph.edges]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  // Add resizeParent option for compound nodes
  const proOptions = { hideAttribution: true };

  return (
    <div className="absolute inset-0">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={memoizedNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.2}
        maxZoom={2}
        proOptions={proOptions}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
        />
        <Controls
          className="bg-slate-800 border border-slate-600 rounded-lg"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
