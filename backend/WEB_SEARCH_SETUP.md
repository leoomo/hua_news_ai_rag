# 网络搜索功能配置说明

## 功能概述

当本地知识库搜索无结果时，系统会自动触发联网查询，使用百度搜索API获取前3条结果，并通过大语言模型进行智能总结。

## 配置步骤

### 1. 获取百度API密钥

1. 访问 [百度智能云](https://cloud.baidu.com/)
2. 注册/登录账号
3. 开通"文心一言"服务
4. 创建应用，获取API Key和Secret Key

### 2. 设置环境变量

在 `backend/` 目录下创建 `.env` 文件：

```bash
# 百度搜索API配置
BAIDU_API_KEY=your-baidu-api-key-here
BAIDU_SECRET_KEY=your-baidu-secret-key-here

# 网络搜索配置
ENABLE_WEB_SEARCH=true
WEB_SEARCH_FALLBACK=true
```

### 3. 安装依赖

确保已安装LangChain相关依赖：

```bash
uv sync -E langchain
```

## API接口

### 自动触发网络搜索

当调用 `/search/semantic` 接口且本地搜索无结果时，系统会自动触发网络搜索：

```json
{
  "code": 0,
  "data": [],
  "web_search": {
    "summary": "AI总结的内容...",
    "web_results": [
      {
        "title": "搜索结果标题",
        "snippet": "搜索结果摘要",
        "url": "来源URL",
        "source": "baidu"
      }
    ],
    "source": "web_search",
    "query": "用户查询"
  },
  "message": "本地知识库未找到相关内容，已为您联网查询并总结"
}
```

### 手动网络搜索

调用 `/search/web` 接口进行专门的网络搜索：

```bash
POST /search/web
Content-Type: application/json

{
  "query": "搜索关键词",
  "top_k": 3
}
```

## 配置选项

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `ENABLE_WEB_SEARCH` | `true` | 是否启用网络搜索功能 |
| `WEB_SEARCH_FALLBACK` | `true` | 本地搜索无结果时是否自动触发网络搜索 |
| `BAIDU_API_KEY` | `""` | 百度API密钥 |
| `BAIDU_SECRET_KEY` | `""` | 百度API密钥 |

## 注意事项

1. 百度API有调用频率限制，请合理使用
2. 网络搜索需要网络连接，请确保服务器能访问外网
3. AI总结功能依赖本地部署的Ollama模型
4. 建议在生产环境中设置适当的超时和重试机制

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查API密钥是否正确
   - 确认API配额是否充足
   - 检查网络连接

2. **AI总结失败**
   - 确认Ollama服务是否运行
   - 检查模型是否已下载
   - 查看日志中的具体错误信息

3. **搜索结果为空**
   - 检查查询关键词是否合适
   - 确认百度API服务状态
   - 查看网络搜索日志
