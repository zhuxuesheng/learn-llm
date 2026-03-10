这是一个非常实用且有趣的工具需求。将枯燥的 `config.json` 转化为直观的架构图，对于 AI 开发者和研究人员理解模型结构非常有帮助。

针对你的需求，我为你编写了一份**大语言模型架构可视化前端详细设计文档**。考虑到项目的轻量化和可访问性，本方案采用**纯前端架构（SPA）**，无需后端服务器，直接通过浏览器请求 Hugging Face 或其镜像站的开放 API 实现。

---

# 大语言模型架构可视化前端设计文档 (LLM Arch-Viewer)

## 1. 项目概述
本项目旨在开发一个基于 Web 的前端应用。用户输入 Hugging Face (或 hf-mirror.com) 的大语言模型主页 URL 后，系统自动解析模型 ID，拉取该模型的 `config.json` 文件，并根据配置参数动态生成且渲染该模型的**网络架构框图**及**核心参数设置表**。

## 2. 需求分析

### 2.1 功能需求
*   **URL 解析**：支持解析 `https://huggingface.co/` 和 `https://hf-mirror.com/` 的模型链接，提取 `[作者/模型名]`（Model ID）。
*   **配置获取**：通过前端跨域请求（CORS），获取模型的 `config.json`。
*   **参数展示**：以结构化表格或卡片形式展示核心超参数（如 `hidden_size`, `num_hidden_layers`, `vocab_size`，以及 MoE 模型的 `num_experts` 等）。
*   **架构可视化**：根据 `config.json` 中的 `model_type` 或 `architectures` 字段，动态绘制具有张量维度信息（Tensor Shapes）的模型架构流程图。
*   **交互功能**：点击架构图中的特定节点（如 Attention、MLP/MoE 模块），在侧边栏高亮显示对应的具体参数。

### 2.2 非功能需求
*   **纯前端部署**：无需后端，可通过 GitHub Pages / Vercel 静态托管。
*   **容错处理**：处理无效链接、网络超时、非 LLM 模型不支持等异常。

---

## 3. 技术栈选型

*   **核心框架**：React 18 + Vite (或 Vue 3)，便于组件化开发和状态管理。
*   **UI 样式**：Tailwind CSS，快速构建现代感的数据大屏面板。
*   **图表绘制**：**React Flow** (或 Vue Flow)。它非常适合绘制基于节点（Node-based）的架构图，支持自定义节点样式和复杂的连线逻辑，比静态图片或 Echarts 更适合神经网络架构展示。
*   **网络请求**：原生 `fetch` 或 `axios`。

---

## 4. 系统架构设计

### 4.1 核心模块划分
系统分为四个核心模块：
1.  **Input Parser (输入解析器)**：处理用户输入，正则匹配提取 Model ID。
2.  **Config Fetcher (配置拉取器)**：拼接 Raw File URL 并发送 HTTP 请求。
3.  **Architecture Mapper (架构映射引擎)**：核心业务逻辑。将 JSON 格式的字典转换为 React Flow 可识别的 Node（节点）和 Edge（连线）。
4.  **UI Renderer (UI 渲染器)**：负责页面布局、图表渲染和参数表格展示。

### 4.2 数据流向 (Data Flow)
`用户输入 URL` $\rightarrow$ `正则提取 {repo_id}` $\rightarrow$ `Fetch 请求 hf-mirror.com/{repo_id}/resolve/main/config.json` $\rightarrow$ `解析 JSON` $\rightarrow$ `生成 Nodes/Edges 数据` $\rightarrow$ `React Flow 渲染图表` + `Table 渲染参数`。

---

## 5. 详细模块设计

### 5.1 URL 解析模块
**正则表达式设计**：
```javascript
const urlPattern = /^(https?:\/\/)?(huggingface\.co|hf-mirror\.com)\/([^/]+\/[^/]+)(\/.*)?$/;
// 输入: https://huggingface.co/Qwen/Qwen3.5-35B-A3B-Base
// 提取 Match[3]: Qwen/Qwen3.5-35B-A3B-Base
```

### 5.2 数据获取模块
利用 Hugging Face 原生的 raw file 解析能力，动态构建请求地址：
```javascript
const modelId = "Qwen/Qwen3.5-35B-A3B-Base";
const mirrorBase = "https://hf-mirror.com"; // 默认使用镜像站保证国内访问速度
const configUrl = `${mirrorBase}/${modelId}/resolve/main/config.json`;

// 获取数据
const response = await fetch(configUrl);
const configData = await response.json();
```

### 5.3 架构映射引擎 (核心)
根据拉取到的 `configData`，解析不同类型的架构。以你提到的 `Qwen3.5-35B-A3B-Base` 为例，这是一个基于 **MoE (Mixture of Experts)** 架构的模型。

**关键参数提取与解析逻辑：**
*   **全局参数**：`vocab_size` (词表), `max_position_embeddings` (上下文长度)。
*   **维度参数**：`hidden_size` (隐藏层维度), `intermediate_size` (FFN/MoE中间维度)。
*   **结构参数**：`num_hidden_layers` (层数), `num_attention_heads` (注意力头数), `num_key_value_heads` (GQA头数)。
*   **MoE 特有参数**（针对 Qwen A3B/MoE 型）：`decoder_sparse_step` (MoE步长), `num_experts` (总专家数), `num_experts_per_tok` (激活专家数)。

**React Flow 节点生成逻辑 (伪代码)：**
```javascript
function generateGraph(config) {
    const nodes = [];
    const edges = [];
    
    // 1. Input Node
    nodes.push({ id: 'input', label: `Input Tokens\n[batch_size, seq_len]` });
    
    // 2. Embedding Layer
    nodes.push({ id: 'emb', label: `Embedding\n[${config.vocab_size} -> ${config.hidden_size}]` });
    edges.push({ source: 'input', target: 'emb' });

    // 3. Decoder Block (展示单层抽象结构，标注 Nx)
    nodes.push({ 
        id: 'decoder_block', 
        label: `Decoder Block (x ${config.num_hidden_layers})`,
        type: 'group' // 组合节点
    });
    
    // 3.1 Attention Node inside Decoder
    nodes.push({ id: 'attn', parentNode: 'decoder_block', label: `Self-Attention\nHeads: ${config.num_attention_heads}\nKV Heads: ${config.num_key_value_heads || config.num_attention_heads}` });
    
    // 3.2 FFN or MoE Node inside Decoder
    if (config.num_experts) {
        nodes.push({ id: 'moe', parentNode: 'decoder_block', label: `MoE Layer\nExperts: ${config.num_experts}\nActive: ${config.num_experts_per_tok}` });
    } else {
        nodes.push({ id: 'mlp', parentNode: 'decoder_block', label: `MLP\n[${config.intermediate_size}]` });
    }

    // ... 连线逻辑 (RMSNorm -> Attn -> Add -> RMSNorm -> MoE -> Add)
    
    // 4. Output / LM Head Node
    nodes.push({ id: 'lm_head', label: `LM Head\n[${config.hidden_size} -> ${config.vocab_size}]` });
    
    return { nodes, edges };
}
```

### 5.4 UI 界面布局设计 (Wireframe)
界面采用 **左-中-右** 三栏结构或 **上下** 结构：

1.  **顶部 Header**：
    *   Logo 和标题。
    *   大尺寸的输入框 (Input URL) + "分析 (Analyze)" 按钮。
    *   快速示例标签 (如：点击体验 `Llama-3-8B`, `Qwen3.5-35B-MoE`)。
2.  **左侧/中间 主视口 (Canvas)**：
    *   **架构画布**：占据主屏幕，使用 React Flow 渲染模型图。
    *   包含缩放、拖拽功能。
    *   节点显示输入输出的张量维度（如 $[B, L, H]$）。
3.  **右侧 面板 (Property Panel)**：
    *   **模型基本信息**：模型名、架构类型 (`model_type`)。
    *   **核心参数表**：分为 Attention 参数、Dimensions 参数、MoE 参数分类展示。
    *   **原始 JSON 查看器**：提供一个可折叠的完整 `config.json` 树状视图。

---

## 6. 特定模型适配方案（以 Qwen3.5-35B-A3B-Base 为例）

当系统识别到 `config.json` 中包含 MoE 相关的特征时（例如 `architectures: ["Qwen2MoeForCausalLM"]`），UI 将做出如下特殊渲染：

1.  **专家路由可视化**：在 Decoder Block 中，将传统的单个 MLP 框替换为一个包含 Router（路由器）和多个平行 Expert（专家）小框的组合组件。
2.  **参数高亮**：在侧边栏明确标出该模型为 MoE 架构，计算并显示：
    *   单层总参数量估计（基于 `num_experts`）。
    *   激活参数量估计（基于 `num_experts_per_tok`）。

---

## 7. 项目实施步骤 (Roadmap)

*   **Phase 1: 基础框架搭建**
    *   初始化 React + Vite 项目，配置 TailwindCSS。
    *   完成 URL 提取与 `hf-mirror` 请求逻辑。
    *   实现右侧的基础参数表格展示。
*   **Phase 2: 架构图渲染基座**
    *   引入 React Flow。
    *   针对最经典的 `LlamaForCausalLM` 架构，硬编码一套 Node 和 Edge 的生成逻辑打样。
*   **Phase 3: 多模型适配与 MoE 支持**
    *   编写工厂模式代码，根据 `model_type` (如 `llama`, `qwen2`, `qwen2_moe`, `mistral`) 路由到不同的架构解析函数。
    *   实现 Qwen3.5-A3B 等 MoE 模型的复杂节点渲染。
*   **Phase 4: 交互与打磨**
    *   实现节点点击联动：点击架构图中的 Attention 节点，右侧参数栏自动滚动并高亮 Attention 相关参数（如 `rope_theta`, `num_heads`）。
    *   处理网络异常、加载动画 (Loading Spinner)。

---

## 8. 可能面临的挑战及解决方案

1.  **CORS 跨域问题**：
    *   *风险*：浏览器直接 fetch Hugging Face 可能被拦截。
    *   *解决方案*：Hugging Face Hub 的 raw 文件通常是支持跨域请求的。如果不行，可统一重定向请求到 `hf-mirror.com`，或在前端使用免费的 CORS Proxy（如 `corsproxy.io`）做备选。
2.  **模型架构种类繁多**：
    *   *风险*：无法为所有上万个模型编写完美的架构图逻辑。
    *   *解决方案*：提取最大公约数。主流开源模型基本是 Decoder-only 架构，统一抽象为 `[Embed] -> [N x (Attention + FFN/MoE)] -> [LMHead]`。对于未知架构，提示“当前架构可视化不支持，但您可以查看右侧的参数表”。
3.  **参数未写明**：
    *   *风险*：如总参数量 `35B` 并不在 `config.json` 中，只有结构信息。
    *   *解决方案*：前端可编写一套简单的公式，根据 `hidden_size`, `num_layers`, `vocab_size` 近似估算参数量（只估算权重，不包括嵌入层绑定等复杂情况），并标明“估算值”。

---

如果你准备开始编写代码，我可以为你提供**核心逻辑的 JavaScript/TypeScript 代码示例**（例如如何用 React Flow 生成上述的 Qwen 模型节点）。