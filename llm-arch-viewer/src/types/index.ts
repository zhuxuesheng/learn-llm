// Model Config Types
export interface ModelConfig {
  architectures?: string[];
  model_type?: string;
  hidden_size: number;
  intermediate_size?: number;
  num_hidden_layers: number;
  num_attention_heads: number;
  num_key_value_heads?: number;
  vocab_size: number;
  max_position_embeddings: number;
  // MoE specific
  num_experts?: number;
  num_experts_per_tok?: number;
  decoder_sparse_step?: number;
  // Other
  rms_norm_eps?: number;
  rope_theta?: number;
  tie_word_embeddings?: boolean;
  [key: string]: unknown;
}

// React Flow Node Types
export interface ArchNode {
  id: string;
  type: 'input' | 'embedding' | 'decoder' | 'attention' | 'mlp' | 'moe' | 'moe-expert' | 'router' | 'lmhead' | 'norm' | 'group' | 'output';
  label: string;
  position?: { x: number; y: number };
  data?: {
    shape?: string;
    params?: Record<string, unknown>;
  };
  parentNode?: string;
  extent?: 'parent' | 'compound';
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

export interface ArchitectureGraph {
  nodes: ArchNode[];
  edges: ArchEdge[];
}

// UI State
export interface ModelInfo {
  modelId: string;
  config: ModelConfig;
  architecture: ArchitectureGraph;
  estimatedParams?: string;
}

export type LoadState = 'idle' | 'loading' | 'success' | 'error';

export interface ViewerState {
  modelInfo: ModelInfo | null;
  loadState: LoadState;
  error?: string;
  selectedNode?: string;
}
