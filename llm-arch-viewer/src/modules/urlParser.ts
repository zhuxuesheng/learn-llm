/**
 * URL Parser Module
 * Extracts model ID from Hugging Face / hf-mirror URLs
 */

export interface ParsedUrl {
  isValid: boolean;
  modelId?: string;
  error?: string;
}

const HF_PATTERN = /^(https?:\/\/)?(huggingface\.co|hf-mirror\.com)\/([^/]+\/[^/]+)(\/.*)?$/;

/**
 * Parse Hugging Face URL and extract model ID
 * @param url - Hugging Face or hf-mirror model URL
 * @returns ParsedUrl with modelId if valid
 */
export function parseModelUrl(url: string): ParsedUrl {
  const trimmed = url.trim();

  if (!trimmed) {
    return { isValid: false, error: 'URL is empty' };
  }

  const match = trimmed.match(HF_PATTERN);

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid URL format. Expected: https://huggingface.co/author/model-name'
    };
  }

  const modelId = match[3];

  // Validate modelId format (should be author/name)
  if (!modelId.includes('/')) {
    return {
      isValid: false,
      error: 'Model ID must be in format: author/model-name'
    };
  }

  return { isValid: true, modelId };
}

/**
 * Validate if a string is a valid model ID
 * @param modelId - Model ID in format author/name
 */
export function isValidModelId(modelId: string): boolean {
  const parts = modelId.split('/');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
