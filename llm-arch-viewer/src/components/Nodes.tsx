/**
 * Custom Node Components for React Flow
 */

import { Handle, Position } from 'reactflow';

interface CustomNodeData {
  label: string;
  shape?: string;
  params?: Record<string, unknown>;
}

const baseNodeStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: '12px',
  border: '2px solid #3b82f6',
  background: '#1e293b',
  color: '#f1f5f9',
  minWidth: '280px',
  maxWidth: '400px',
  fontSize: '13px',
  lineHeight: '1.6',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
};

interface NodeComponentProps {
  id?: string;
  data: CustomNodeData;
  type?: string;
  selected?: boolean;
  isConnectable?: boolean;
  hideTarget?: boolean;
  hideSource?: boolean;
}

export function CustomNode({ data, type, hideTarget, hideSource }: NodeComponentProps) {
  // Check if this is a group/parent node - use exact type check, not label matching
  const isGroupNode = type === 'group';

  // Group nodes (parent containers) - label displayed at top border
  if (isGroupNode) {
    return (
      <div style={{
        border: '3px dashed #8b5cf6',
        borderRadius: '16px',
        background: 'transparent',
        minWidth: '450px',
        minHeight: '100%',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}>
        {/* Label positioned at top left */}
        <div className="absolute top-0 left-3 bg-slate-950 px-2 z-10">
          <span className="font-semibold text-sm text-purple-300 whitespace-pre-line">{data.label}</span>
        </div>
      </div>
    );
  }

  // Regular nodes with background box
  return (
    <div style={{ ...baseNodeStyle, position: 'relative' }}>
      {!hideTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-blue-400 !w-4 !h-4"
          style={{ left: '50%', transform: 'translateX(-50%)', right: 'auto' }}
        />
      )}
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-base whitespace-pre-line">{data.label}</span>
        {data.shape && (
          <span className="text-xs text-blue-300 font-mono">{data.shape}</span>
        )}
      </div>
      {!hideSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-blue-400 !w-4 !h-4"
          style={{ left: '50%', transform: 'translateX(-50%)', right: 'auto' }}
        />
      )}
    </div>
  );
}

// Export individual node types for React Flow (all use the same CustomNode with different styling)
export const InputNode = (props: NodeComponentProps) => (
  <CustomNode {...props} hideTarget />
);
export const EmbeddingNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const DecoderNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const AttentionNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const MlpNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const MoeNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const NormNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const LmHeadNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const GroupNode = (props: NodeComponentProps) => (
  <CustomNode {...props} />
);
export const OutputNode = (props: NodeComponentProps) => (
  <CustomNode {...props} hideSource />
);
