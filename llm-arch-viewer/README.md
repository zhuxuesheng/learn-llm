# LLM Arch-Viewer

Visualize Large Language Model architecture from Hugging Face config.json files.

## Features

- **URL Parsing**: Support for huggingface.co and hf-mirror.com model URLs
- **Architecture Visualization**: Interactive diagram of model architecture using React Flow
- **Parameter Display**: Structured view of key model parameters
- **MoE Support**: Special visualization for Mixture of Experts models (like Qwen-MoE, Mixtral)
- **Pure Frontend**: No backend required, runs entirely in the browser

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Flow** - Node-based architecture visualization

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Open the app in your browser (default: http://localhost:5173)
2. Enter a Hugging Face model URL, e.g.:
   - `https://huggingface.co/meta-llama/Llama-3.1-8B`
   - `https://hf-mirror.com/Qwen/Qwen3.5-35B-A3B-Base`
3. Click "Analyze" to load and visualize the model architecture

### Example Models

- **Llama 3.1 8B**: `meta-llama/Llama-3.1-8B`
- **Qwen3.5 MoE**: `Qwen/Qwen3.5-35B-A3B-Base`
- **Mixtral 8x7B**: `mistralai/Mixtral-8x7B-v0.1`

## Architecture

```
src/
├── components/          # React components
│   ├── Header.tsx       # URL input and logo
│   ├── ArchitectureCanvas.tsx  # React Flow visualization
│   ├── PropertyPanel.tsx       # Model info sidebar
│   ├── Nodes.tsx        # Custom node components
│   └── States.tsx       # Loading, error, empty states
├── modules/             # Business logic
│   ├── urlParser.ts     # URL parsing logic
│   ├── configFetcher.ts # Fetch config.json from HF
│   └── architectureMapper.ts   # Convert config to graph
├── types/               # TypeScript types
└── App.tsx              # Main app component
```

## How It Works

1. **Parse URL**: Extract model ID from Hugging Face URL
2. **Fetch Config**: Download `config.json` from hf-mirror.com or huggingface.co
3. **Generate Graph**: Convert config parameters into React Flow nodes and edges
4. **Render**: Display interactive architecture diagram with parameter sidebar

## Supported Architectures

- Llama Decoder-Only
- Qwen Decoder-Only
- Qwen MoE
- Mistral Decoder-Only
- Mixtral MoE
- Gemma Decoder-Only
- Phi-3 Decoder-Only
- More Decoder-Only variants

## License

MIT
