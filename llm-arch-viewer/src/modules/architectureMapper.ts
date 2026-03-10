/**
 * Architecture Mapper Module
 * Converts model config.json into React Flow nodes and edges
 */

import type { ModelConfig, ArchitectureGraph, ArchNode, ArchEdge } from '../types';

/**
 * Generate architecture graph from model config
 * @param config - Model config
 * @returns ArchitectureGraph with nodes and edges
 */
export function generateArchitecture(config: ModelConfig): ArchitectureGraph {
  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];

  // Check if this is a MoE model
  const isMoE = !!(config.num_experts && config.num_experts > 1);

  // 1. Input Node
  nodes.push({
    id: 'input',
    type: 'input',
    label: `Input Tokens\n[batch, seq_len]`,
    position: { x: 0, y: 0 }
  });

  // 2. Embedding Layer
  nodes.push({
    id: 'embedding',
    type: 'embedding',
    label: `Token Embedding\n[${config.vocab_size} → ${config.hidden_size}]`,
    position: { x: 0, y: 100 }
  });
  edges.push({
    id: 'input->embedding',
    source: 'input',
    target: 'embedding',
    animated: true
  });

  // 3. Decoder Block (shown as abstract block with layer count)
  const decoderY = 250;
  const nodeSpacing = 90; // spacing between internal nodes
  nodes.push({
    id: 'decoder',
    type: 'group',
    label: `Decoder Block (×${config.num_hidden_layers} layers)`,
    position: { x: 0, y: decoderY }
  });

  // 3a. Input Norm (RMSNorm/LayerNorm) - inside decoder
  nodes.push({
    id: 'norm1',
    type: 'norm',
    label: `RMSNorm`,
    parentNode: 'decoder',
    position: { x: 50, y: 40 }
  });

  // Edge from embedding to norm1 (first internal node)
  edges.push({
    id: 'embedding->norm1',
    source: 'embedding',
    target: 'norm1'
  });

  // 3b. Self-Attention
  const kvHeads = config.num_key_value_heads || config.num_attention_heads;
  const attnLabel = config.num_key_value_heads
    ? `Self-Attention (GQA)\nHeads: ${config.num_attention_heads}, KV: ${kvHeads}`
    : `Self-Attention (MQA/GQA)\nHeads: ${config.num_attention_heads}`;

  nodes.push({
    id: 'attention',
    type: 'attention',
    label: attnLabel,
    parentNode: 'decoder',
    position: { x: 50, y: 40 + nodeSpacing }
  });
  edges.push({
    id: 'norm1->attention',
    source: 'norm1',
    target: 'attention'
  });

  // 3c. Attention Output Norm + Residual
  nodes.push({
    id: 'residual1',
    type: 'norm',
    label: `+ Residual`,
    parentNode: 'decoder',
    position: { x: 50, y: 40 + nodeSpacing * 2 }
  });
  edges.push({
    id: 'attention->residual1',
    source: 'attention',
    target: 'residual1'
  });

  // 3d. Second Norm
  nodes.push({
    id: 'norm2',
    type: 'norm',
    label: `RMSNorm`,
    parentNode: 'decoder',
    position: { x: 50, y: 40 + nodeSpacing * 3 }
  });
  edges.push({
    id: 'residual1->norm2',
    source: 'residual1',
    target: 'norm2'
  });

  // 3e. FFN or MoE
  if (isMoE) {
    // MoE Branch
    nodes.push({
      id: 'moe',
      type: 'moe',
      label: `MoE Layer\nExperts: ${config.num_experts}\nActive: ${config.num_experts_per_tok || 1}`,
      parentNode: 'decoder',
      position: { x: 50, y: 40 + nodeSpacing * 4 }
    });
    edges.push({
      id: 'norm2->moe',
      source: 'norm2',
      target: 'moe'
    });
  } else {
    // Standard MLP
    const intermediateSize = config.intermediate_size || config.hidden_size * 4;
    nodes.push({
      id: 'mlp',
      type: 'mlp',
      label: `MLP\n[${config.hidden_size} → ${intermediateSize} → ${config.hidden_size}]`,
      parentNode: 'decoder',
      position: { x: 50, y: 40 + nodeSpacing * 4 }
    });
    edges.push({
      id: 'norm2->mlp',
      source: 'norm2',
      target: 'mlp'
    });
  }

  // 3f. FFN/MoE Output + Residual
  const ffnType = isMoE ? 'moe' : 'mlp';
  nodes.push({
    id: 'residual2',
    type: 'norm',
    label: `+ Residual`,
    parentNode: 'decoder',
    position: { x: 50, y: 40 + nodeSpacing * 5 }
  });
  edges.push({
    id: `${ffnType}->residual2`,
    source: ffnType,
    target: 'residual2'
  });

  // Edge from residual2 (last internal node) to final_norm
  edges.push({
    id: 'residual2->final_norm',
    source: 'residual2',
    target: 'final_norm'
  });

  // 4. Final Norm - position after decoder block
  const decoderHeight = 40 + nodeSpacing * 5 + 60; // last node y + padding
  nodes.push({
    id: 'final_norm',
    type: 'norm',
    label: `Final RMSNorm`,
    position: { x: 0, y: decoderY + decoderHeight + 50 }
  });

  // 5. LM Head
  nodes.push({
    id: 'lm_head',
    type: 'lmhead',
    label: `LM Head\n[${config.hidden_size} → ${config.vocab_size}]`,
    position: { x: 0, y: decoderY + decoderHeight + 50 + 100 }
  });
  edges.push({
    id: 'final_norm->lm_head',
    source: 'final_norm',
    target: 'lm_head'
  });

  // 6. Output
  nodes.push({
    id: 'output',
    type: 'output',
    label: `Output Logits\n[vocab_size]`,
    position: { x: 0, y: decoderY + decoderHeight + 50 + 200 }
  });
  edges.push({
    id: 'lm_head->output',
    source: 'lm_head',
    target: 'output',
    animated: true
  });

  return { nodes, edges };
}

/**
 * Get architecture type from config
 * @param config - Model config
 * @returns Architecture type string
 */
export function getArchitectureType(config: ModelConfig): string {
  const arch = config.architectures?.[0] || config.model_type || 'unknown';

  // Map common architectures
  const archMap: Record<string, string> = {
    LlamaForCausalLM: 'Llama Decoder-Only',
    Qwen2ForCausalLM: 'Qwen Decoder-Only',
    Qwen2MoeForCausalLM: 'Qwen MoE',
    MistralForCausalLM: 'Mistral Decoder-Only',
    MixtralForCausalLM: 'Mixtral MoE',
    GemmaForCausalLM: 'Gemma Decoder-Only',
    Phi3ForCausalLM: 'Phi-3 Decoder-Only',
    OlmoForCausalLM: 'OLMo',
    MambaForCausalLM: 'Mamba (SSM)',
  };

  return archMap[arch] || `${arch} (Decoder-Only)`;
}

/**
 * Check if model uses MoE architecture
 * @param config - Model config
 */
export function isMoEModel(config: ModelConfig): boolean {
  return !!(config.num_experts && config.num_experts > 1);
}

/**
 * Get model summary for display
 * @param config - Model config
 */
export function getModelSummary(config: ModelConfig): Record<string, string | number> {
  const summary: Record<string, string | number> = {
    'Hidden Size': config.hidden_size,
    'Num Layers': config.num_hidden_layers,
    'Attention Heads': config.num_attention_heads,
    'Vocab Size': config.vocab_size,
    'Max Position': config.max_position_embeddings,
  };

  if (config.num_key_value_heads) {
    summary['KV Heads'] = config.num_key_value_heads;
  }

  if (config.intermediate_size) {
    summary['Intermediate Size'] = config.intermediate_size;
  }

  if (config.num_experts) {
    summary['Num Experts'] = config.num_experts;
    summary['Experts/Token'] = config.num_experts_per_tok || 1;
  }

  if (config.rms_norm_eps) {
    summary['RMS Norm Eps'] = config.rms_norm_eps;
  }

  if (config.rope_theta) {
    summary['RoPE Theta'] = config.rope_theta;
  }

  return summary;
}
