## 业务总览

本系统覆盖“RSS 源管理与采集 → 数据清洗/去重/丰富 → 知识库与向量索引 → 检索/问答 → 分析/仪表盘”，并提供自动与手动采集两种模式。

### 业务流程图

```mermaid
flowchart TD
  A["前端: 设置/管理RSS源"] -->|添加/编辑/删除/启用| B["后端: /api/settings/rss"]
  A -->|手动采集| C["后端: /api/settings/rss/ingest 或 /ingest_all"]
  A -->|自动采集开关| D["后端: /api/scheduler/start / stop"]

  subgraph S1["采集与处理 (后端)"]
    C --> E["Fetcher 抓取 RSS 与正文 (robots + 限流)"]
    E --> F["清洗: HTML→Text"]
    F --> G["去重: URL哈希 + SimHash"]
    G --> H["入库: news_articles"]
    H --> I["丰富: 摘要/关键词 (enrich)"]
    I --> J["写入：summary, keywords"]
    J --> K["采集日志: ingest_logs"]
  end

  D --> L["APScheduler 周期任务: ingest_all_sources"]
  L --> C
  K --> M["状态查询: /api/settings/rss/status"]
  B --> M

  subgraph S2["检索/问答 (后端)"]
    H --> N["构建向量索引: FAISS(最近N篇分片+嵌入)"]
    N --> O["语义检索: /api/search/semantic"]
    H --> P["RetrievalQA: /api/search/qa (LangChain + Ollama)"]
  end

  subgraph S3["前端展示"]
    Q["知识库 /kb"] -->|GET /api/kb/items| R["列表(标题/摘要/内容)"]
    R --> O
    R --> P
    S["分析 /analytics"] -->|GET /api/analytics/keywords_top & /trend| T["关键词Top & 趋势"]
    U["仪表盘 /"] -->|GET /api/dashboard/summary| V["总量/近7天/最新"]
  end

  style S1 fill:#f7f7ff
  style S2 fill:#f7fff7
  style S3 fill:#fff7f7
```

### 核心说明
- 采集入口：手动触发（单源或批量）与自动计划任务（APScheduler）。
- 处理流水线：抓取→清洗→去重→入库→丰富（摘要/关键词）。
- 检索：优先使用多语种向量检索，中文查询时启用中文偏好与中文严格过滤（纯中文时）。
- 问答：LangChain RetrievalQA，基于片段检索的回答与来源回溯。
- 分析/仪表盘：关键词统计、近7天趋势、总量+最新。

---

### 关键交互时序图（手动采集与检索）

```mermaid
sequenceDiagram
  autonumber
  participant FE as 前端 (Next.js)
  participant API as 后端 (Flask)
  participant DB as SQLite
  participant EN as Enrich/Utils
  participant EM as Embeddings/FAISS
  participant QA as LangChain/Ollama

  rect rgb(247,247,255)
    FE->>API: POST /api/settings/rss/ingest?id=sourceId
    API->>DB: 读取 RssSource
    API->>API: Fetcher 抓取 RSS & 正文 (robots/限流)
    API->>EN: 清洗文本 → 去重(URL hash/SimHash)
    EN-->>API: 去重结果
    API->>DB: 写入 news_articles
    API->>EN: 摘要/关键词提取
    EN-->>API: summary/keywords
    API->>DB: 更新摘要/关键词
    API->>DB: 写入 ingest_logs
    API-->>FE: 返回 {created, skipped}
  end

  rect rgb(247,255,247)
    FE->>API: POST /api/search/semantic {query}
    API->>DB: 读最近N篇文章
    API->>EM: 分片 + 多语种向量嵌入 & 建索引
    EM-->>API: 内存索引 + 映射
    API->>EM: 查询向量检索 (中文偏好/过滤)
    EM-->>API: TopK 结果ID+分数
    API->>DB: 批量读取文章明细
    API-->>FE: 返回排序后的结果列表
  end

  rect rgb(255,247,247)
    FE->>API: POST /api/search/qa {query}
    API->>QA: 构建/获取 RetrievalQA 链
    QA->>DB: 检索上下文 (内置向量存储或临时构建)
    DB-->>QA: 返回片段
    QA-->>API: 回答文本 + 来源片段
    API-->>FE: 返回 {answer, sources}
  end
```

### 端点清单（关键）
- 设置/源管理：
  - POST/PATCH/DELETE/GET `/api/settings/rss`（增改删查）
  - POST `/api/settings/rss/ingest?id=`（单源采集）
  - POST `/api/settings/rss/ingest_all`（批量采集）
  - GET `/api/settings/rss/status`（采集日志状态）
- 检索与问答：
  - POST `/api/search/semantic`（语义检索，中文偏好/过滤策略已启用）
  - POST `/api/search/qa`（检索增强问答）
- 知识库与详情：
  - GET `/api/kb/items`（标题/摘要/内容）
  - GET `/api/kb/item?id=`（文章详情）
- 分析与仪表盘：
  - GET `/api/analytics/keywords_top`、`/api/analytics/trend`（关键词Top、日趋势）
  - GET `/api/dashboard/summary`（总数、近7天、最新5篇）
- 调度控制：
  - POST `/api/scheduler/start`（创建周期任务并立即运行一次）
  - POST `/api/scheduler/stop`（删除周期任务）
  - GET `/api/scheduler/status`（是否启用、任务下次运行时间）

### 非功能性要点
- 性能：抓取限流、FAISS 内存索引（最近N篇）、多语种嵌入批量化。
- 稳定性：启动时确保表/列存在；采集失败写日志并不中断其他源。
- 可维护性：模块化（fetcher/enrich/utils/embeddings/vectorstore/qa），端点清晰。
- 安全与合规：遵循 robots，避免高频抓取；用户态鉴权在中间件（已预留）。


