/**
 * Config Fetcher Module
 * Fetches and parses config.json from Hugging Face / hf-mirror
 */

import type { ModelConfig } from '../types';

export interface FetchResult {
  success: boolean;
  config?: ModelConfig;
  error?: string;
}

/**
 * Fetch model config from Hugging Face or hf-mirror
 * Hugging Face supports CORS, so we can fetch directly from the browser
 */
export async function fetchModelConfig(
  modelId: string,
  source: 'hf-mirror' | 'huggingface' | 'auto' = 'auto'
): Promise<FetchResult> {
  // In auto mode, always use huggingface.co first (it supports CORS)
  if (source === 'auto') {
    const result = await fetchFromSource(modelId, 'https://huggingface.co');
    if (result.success) {
      return result;
    }
    // If huggingface failed with CORS/network error, suggest using proxy
    if (result.error?.includes('CORS') || result.error?.includes('Failed to fetch')) {
      return {
        success: false,
        error: `Cannot connect to Hugging Face. This may be due to network restrictions.

Suggestions:
1. Try using a VPN or proxy
2. Check if huggingface.co is accessible in your network
3. Try running the app locally (npm run dev) which uses server-side proxy`
      };
    }
    return result;
  }

  // Direct source fetch
  const baseUrl = source === 'hf-mirror' ? 'https://hf-mirror.com' : 'https://huggingface.co';
  return fetchFromSource(modelId, baseUrl);
}

async function fetchFromSource(modelId: string, baseUrl: string): Promise<FetchResult> {
  const url = `${baseUrl}/${modelId}/resolve/main/config.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Model "${modelId}" not found. Please check the model ID.`
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          error: `Access denied to model "${modelId}". It may be a private model.`
        };
      }
      if (response.status === 401) {
        return {
          success: false,
          error: `Authentication required for model "${modelId}". This model requires Hugging Face login.`
        };
      }
      return {
        success: false,
        error: `Failed to fetch config: ${response.status} ${response.statusText}`
      };
    }

    // Parse JSON directly - Hugging Face and hf-mirror return JSON for config files
    let config = await response.json();

    // Handle multimodal models (e.g., Qwen3.5-MoE) where text config is nested
    if (config.text_config && config.text_config.hidden_size) {
      config = {
        ...config.text_config,
        architectures: config.architectures,
        model_type: config.text_config.model_type || config.model_type,
        tie_word_embeddings: config.tie_word_embeddings,
        vocab_size: config.text_config.vocab_size,
      };
    }

    // Handle Qwen3-ASR style where config is nested in thinker_config.text_config
    if (config.thinker_config?.text_config && config.thinker_config.text_config.hidden_size) {
      config = {
        ...config.thinker_config.text_config,
        architectures: config.architectures,
        model_type: config.thinker_config.text_config.model_type || config.model_type,
        tie_word_embeddings: config.thinker_config.tie_word_embeddings,
        vocab_size: config.thinker_config.text_config.vocab_size,
      };
    }

    // Normalize field names for different model families (e.g., GPT-2 uses n_embd, n_layer, etc.)
    const normalizedConfig: ModelConfig = {
      ...config,
      hidden_size: config.hidden_size || (config as any).n_embd,
      num_hidden_layers: config.num_hidden_layers || (config as any).n_layer,
      num_attention_heads: config.num_attention_heads || (config as any).n_head,
      vocab_size: config.vocab_size || (config as any).vocab_size,
      intermediate_size: config.intermediate_size || (config as any).n_inner || undefined,
      layer_norm_epsilon: config.layer_norm_epsilon || (config as any).layer_norm_epsilon,
    };

    // Validate required fields
    if (!normalizedConfig.hidden_size || !normalizedConfig.num_hidden_layers) {
      return {
        success: false,
        error: 'Invalid config.json: missing required fields (hidden_size, num_hidden_layers)'
      };
    }

    if (!normalizedConfig.architectures && !normalizedConfig.model_type) {
      return {
        success: false,
        error: 'This does not appear to be an LLM model config'
      };
    }

    return { success: true, config: normalizedConfig };
  } catch (error) {
    // Check if it's a CORS error
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: `CORS error: Cannot access ${baseUrl} from this origin. Try using a different mirror or check your network.`
      };
    }

    // Check if it's a JSON parse error
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Received invalid JSON response. The model config might be corrupted.'
      };
    }

    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Estimate parameter count based on config
 */
export function estimateParams(config: ModelConfig): string {
  const {
    hidden_size,
    intermediate_size,
    num_hidden_layers,
    num_attention_heads,
    vocab_size,
    num_experts,
  } = config;

  const embedParams = vocab_size * hidden_size;
  const headDim = hidden_size / num_attention_heads;
  const attentionParams = num_hidden_layers * (
    3 * hidden_size * headDim * num_attention_heads +
    hidden_size * hidden_size
  );

  let ffnParams: number;
  const intermediate = intermediate_size || (4 * hidden_size);

  if (num_experts) {
    ffnParams = num_hidden_layers * (
      num_experts * (hidden_size * intermediate * 2) +
      hidden_size * num_experts
    );
  } else {
    ffnParams = num_hidden_layers * (hidden_size * intermediate * 2);
  }

  const totalParams = embedParams + attentionParams + ffnParams;

  if (totalParams >= 1e9) {
    return `${(totalParams / 1e9).toFixed(1)}B`;
  }
  return `${(totalParams / 1e6).toFixed(0)}M`;
}
