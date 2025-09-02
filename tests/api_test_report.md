## API 测试报告（Smoke Tests）

执行时间：本地执行（以当前机器时间为准）
执行环境：
- Base URL: `http://localhost:5050`
- 运行命令：`API_BASE_URL=http://localhost:5050 uv run python tests/smoke_test.py`
- 依赖：`requests`

### 一、目标
- 按照 `openapi.yaml` 覆盖健康检查、登录/鉴权、知识库增删改查（抽样）、语义检索、QA、分析等关键路径的连通性与基本响应。

### 二、结果摘要（通过）
- 健康检查（GET /api/health）：通过 (200)
- 登录（POST /api/auth/login）：通过 (200)，成功获取 token
- 我（GET /api/auth/me）：通过 (200)
- 知识库列表（GET /api/kb/items）：通过 (200)
- 批量入库（POST /api/kb/items）：通过 (200)
- 语义搜索（POST /api/search/semantic）：通过 (200)
- QA（POST /api/search/qa）：通过 (200)
- 关键词分析（GET /api/analytics/keywords）：通过 (200)

### 三、样例输出片段（节选）
- /api/auth/login → { code: 0, data: { token: "..." } }
- /api/kb/items → { code: 0, data: { items: [...], total: N } }
- /api/search/qa → { code: 0, data: { answer: "...", citations: [...] } }

### 四、执行记录（命令）
```
PORT=5050 uv run python backend/app.py   # 后端启动于 5050 端口
API_BASE_URL=http://localhost:5050 uv run python tests/smoke_test.py
```

### 五、注意事项与建议
- 若本机 5000 端口被占用或有网关拦截，可使用 5050 端口并在前端 `.env.local` 中设置：
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050
```
- 健康检查 `/api/health` 已放行匿名访问，便于容器/部署探针检查。

### 六、后续扩展
- 增加负载测试（如 locust/k6）和更丰富的断言（字段校验）
- 将 `tests/smoke_test.py` 接入 CI，在 PR 触发
- 为 /api/settings/rss、/api/settings/models 等接口补充用例

---
报告位置：tests/api_test_report.md（本文件）
