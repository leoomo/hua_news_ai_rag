## 个性化新闻智能知识库 UI 组件清单

依据：product_requirements_document.md / product_design_document.md
目的：指导前端原型搭建与组件开发复用。

---

### 全局组件
- 顶部导航（AppHeader）
  - 区域：Logo、导航菜单（仪表盘/知识库/查询/分析/设置）、用户菜单
- 侧边栏（AppSidebar，可选）
  - 二级导航与过滤器容器
- 面包屑（Breadcrumbs）
- 通知条（GlobalNoticeBar）
- 确认对话框（ConfirmDialog）
- 加载/空状态（Spinner/EmptyState）
- 分页器（Paginator）

---

### 登录页（/login）
- 表单（LoginForm）
  - 输入：username/email、password
  - 按钮：登录、忘记密码（占位）
  - 校验：必填、格式
  - 反馈：错误提示、登录中状态

---

### 仪表盘（/）
- 概览卡片（StatCard）×4
  - 今日入库、待审核、检索请求、失败任务
- 任务流状态（JobTimeline）
- 最近数据表（RecentTable）
- 快速入口（QuickActions）：新建RSS、导入Excel、发起检索

---

### 知识库列表（/kb）
- 过滤区（FilterBar）
  - 类型、来源、时间范围、标签、多选
- 表格（ArticleTable）
  - 列：标题、来源、标签、发布时间、状态、相似度（可选）
  - 行内操作：查看、编辑、删除
  - 批量：选择框 + 批量删除/标签编辑
- 工具栏（Toolbar）
  - 按钮：导入（UploadExcelButton）、新增条目（NewItemButton）

---

### 文章详情/编辑（/kb/[id]）
- 详情头（DetailHeader）
  - 标题、来源链接、发布时间、状态标签
- 元数据表单（MetadataForm）
  - 标签、类别、重要性
- 正文查看（ContentViewer）
  - 折叠/展开、分块查看
- 操作区（ActionBar）
  - 保存、删除、重建向量

---

### 语义搜索（/search）
- 搜索框（SemanticSearchBox）
  - 历史建议、清空、TopK选择
- 结果列表（SearchResultList）
  - 卡片：摘要、相似度、引用片段、高亮、来源链接
  - 展开查看上下文（ContextAccordion）
- 回退提示（FallbackHint）
  - 无命中时触发联网搜索按钮

---

### 数据分析（/analytics）
- 时间与来源筛选（AnalyticsFilter）
- 关键词Top10（KeywordTopChart）
- 趋势折线（TrendLineChart）
- 导出按钮（ExportReportButton）

---

### 设置 - RSS 管理（/settings/rss）
- RSS表格（RssTable）
  - 列：名称、URL、类别、启用、抓取间隔、最近抓取
  - 操作：编辑、删除、立即抓取
- 表单对话框（RssFormDialog）
- 立即抓取按钮（FetchNowButton）

---

### 设置 - 模型与API（/settings/models）
- 模型配置表单（ModelConfigForm）
  - LLM（Ollama baseURL、model）、Embedding、Reranker、TopK、温度
- API Key 管理（ApiKeyManager）

---

### 设置 - 用户与角色（/settings/users）
- 用户表（UserTable）
  - 列：用户名、邮箱、角色、状态、最近登录
  - 操作：重置密码、禁用/启用、删除
- 角色分配对话框（RoleAssignDialog）

---

### 通知（全局）
- 邮件模板表单（MailTemplateForm）
- 测试邮件按钮（SendTestMailButton）

---

### 交互要点
- 批量操作需二次确认
- 删除与重要变更需气泡确认 + 撤销提示
- 表格列宽与密度可调
- 表单保存后回到来源页并提示成功
- 全站键盘可用性（/聚焦、Esc 关闭弹层）
