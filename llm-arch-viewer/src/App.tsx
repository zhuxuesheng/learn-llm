/**
 * LLM Arch-Viewer Main App
 * Visualize LLM architecture from Hugging Face config.json
 */

import { useState, useCallback } from 'react';
import { Header, PropertyPanel, ArchitectureCanvas, EmptyState, LoadingSpinner, ErrorDisplay } from './components';
import { parseModelUrl } from './modules/urlParser';
import { fetchModelConfig, estimateParams } from './modules/configFetcher';
import { generateArchitecture } from './modules/architectureMapper';
import type { ModelInfo, LoadState } from './types';
import './App.css';

function App() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | undefined>();
  const [selectedNode, setSelectedNode] = useState<string | undefined>();

  const handleAnalyze = useCallback(async (url: string) => {
    // Reset state
    setLoadState('loading');
    setError(undefined);
    setSelectedNode(undefined);

    // Parse URL
    const parsed = parseModelUrl(url);
    if (!parsed.isValid) {
      setLoadState('error');
      setError(parsed.error);
      return;
    }

    const modelId = parsed.modelId!;

    try {
      // Fetch config (auto mode: tries hf-mirror first, then huggingface)
      const result = await fetchModelConfig(modelId, 'auto');
      if (!result.success) {
        setLoadState('error');
        setError(result.error);
        return;
      }

      const config = result.config!;

      // Generate architecture graph
      const architecture = generateArchitecture(config);

      // Create model info
      const info: ModelInfo = {
        modelId,
        config,
        architecture,
        estimatedParams: estimateParams(config),
      };

      setModelInfo(info);
      setLoadState('success');
    } catch (e) {
      setLoadState('error');
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
  }, []);

  const handleRetry = useCallback(() => {
    if (modelInfo) {
      handleAnalyze(`https://huggingface.co/${modelInfo.modelId}`);
    }
  }, [modelInfo, handleAnalyze]);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <Header onAnalyze={handleAnalyze} isLoading={loadState === 'loading'} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Architecture Canvas */}
        <div className="flex-1 relative">
          {loadState === 'idle' && <EmptyState />}
          {loadState === 'loading' && <LoadingSpinner />}
          {loadState === 'error' && <ErrorDisplay message={error || 'Unknown error'} onRetry={handleRetry} />}
          {loadState === 'success' && modelInfo && (
            <ArchitectureCanvas
              graph={modelInfo.architecture}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>

        {/* Property Panel */}
        <PropertyPanel
          modelInfo={modelInfo}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
        />
      </div>
    </div>
  );
}

export default App;
