/**
 * Property Panel Component
 * Displays model info, parameters table, and selected node details
 */

import type { ModelInfo } from '../types';
import { getModelSummary, getArchitectureType } from '../modules/architectureMapper';
import { estimateParams } from '../modules/configFetcher';

interface PropertyPanelProps {
  modelInfo: ModelInfo | null;
  selectedNode?: string;
  onNodeSelect: (nodeId: string | undefined) => void;
}

export function PropertyPanel({ modelInfo, selectedNode, onNodeSelect }: PropertyPanelProps) {
  if (!modelInfo) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto">
        <div className="text-slate-400 text-sm text-center mt-8">
          <p>Enter a Hugging Face model URL</p>
          <p className="mt-2">to view its architecture</p>
        </div>
      </aside>
    );
  }

  const { config, modelId } = modelInfo;
  const summary = getModelSummary(config);
  const archType = getArchitectureType(config);
  const estimatedParams = estimateParams(config);

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto">
      {/* Model Info Card */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Model Info</h2>
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-sm text-blue-400 font-mono break-all mb-2">{modelId}</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400 text-xs">Architecture</span>
              <span className="text-white text-xs font-medium">{archType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-xs">Est. Params</span>
              <span className="text-green-400 text-xs font-medium">{estimatedParams}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parameters Table */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-2">Parameters</h2>
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {Object.entries(summary).map(([key, value]) => (
                <tr key={key} className="border-b border-slate-700 last:border-0">
                  <td className="py-2 px-3 text-slate-400">{key}</td>
                  <td className="py-2 px-3 text-white text-right font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Config (Collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Raw config.json
        </summary>
        <div className="mt-2 bg-slate-800 rounded-lg p-3 max-h-64 overflow-y-auto">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </details>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Selected Node</h2>
            <button
              onClick={() => onNodeSelect(undefined)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-sm text-white font-mono">{selectedNode}</p>
            <p className="text-xs text-slate-400 mt-1">
              Click on nodes in the diagram to see details
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
