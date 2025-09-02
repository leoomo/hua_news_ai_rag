# 系统架构代码与配置附录

本附录汇总系统架构中的示例代码与配置片段，便于工程实现与查阅。

## 1. 数据架构示例

### 1.1 SQLite 表结构

```sql
-- users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- news_articles
CREATE TABLE news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(500),
    source_name VARCHAR(100),
    published_at TIMESTAMP,
    category VARCHAR(50),
    tags TEXT,
    importance_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vector_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
);

-- rss_sources
CREATE TABLE rss_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_fetch TIMESTAMP,
    fetch_interval INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- query_logs
CREATE TABLE query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    query_text TEXT NOT NULL,
    query_type VARCHAR(20),
    result_count INTEGER,
    response_time FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 1.2 FAISS 向量索引与管理

```python
# FAISS 索引配置
class VectorIndex:
    def __init__(self):
        self.dimension = 384
        self.nlist = 100
        self.index = faiss.IndexIVFFlat(
            faiss.IndexFlatL2(self.dimension),
            self.dimension,
            self.nlist
        )
    
    def add_vectors(self, vectors, ids):
        self.index.add_with_ids(vectors, ids)
    
    def search(self, query_vector, k=10):
        return self.index.search(query_vector, k)


class VectorManager:
    def __init__(self):
        self.index = VectorIndex()
        self.vector_cache = {}
    
    def store_article_vector(self, article_id, content):
        embedding = self.get_embedding(content)
        self.index.add_vectors([embedding], [article_id])
        self.vector_cache[article_id] = embedding
    
    def search_similar_articles(self, query, k=10):
        query_vector = self.get_embedding(query)
        distances, indices = self.index.search([query_vector], k)
        return list(zip(indices[0], distances[0]))
```

## 2. LangChain/RAG 组件

```python
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

class KnowledgeBaseBuilder:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
    
    def build_from_articles(self, articles):
        texts = []
        metadatas = []
        for article in articles:
            chunks = self.text_splitter.split_text(article.content)
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                metadatas.append({
                    "article_id": article.id,
                    "chunk_index": i,
                    "title": article.title,
                    "source": article.source_name,
                    "category": article.category
                })
        return FAISS.from_texts(texts, self.embeddings, metadatas=metadatas)
```

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.llms import Ollama

class RAGSystem:
    def __init__(self):
        self.llm = Ollama(model="qwen2.5:3b")
        self.compressor = LLMChainExtractor.from_llm(self.llm)
    
    def retrieve_and_generate(self, query, vectorstore, k=5):
        base_retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )
        compression_retriever = ContextualCompressionRetriever(
            base_compressor=self.compressor,
            base_retriever=base_retriever
        )
        docs = compression_retriever.get_relevant_documents(query)
        context = "\n\n".join([doc.page_content for doc in docs])
        prompt = f"基于以下上下文回答问题：\n\n上下文：{context}\n\n问题：{query}\n\n回答："
        return self.llm(prompt), docs
```

## 3. 模型服务接口

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any
import requests

class LLMProvider(ABC):
    @abstractmethod
    def generate_text(self, prompt: str, **kwargs) -> str: ...
    @abstractmethod
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]: ...

class OllamaProvider(LLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    def generate_text(self, prompt: str, **kwargs) -> str:
        url = f"{self.base_url}/api/generate"
        data = {"model": "qwen2.5:3b", "prompt": prompt, "stream": False, **kwargs}
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()["response"]
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        url = f"{self.base_url}/api/embeddings"
        embeddings = []
        for text in texts:
            data = {"model": "qwen2.5:3b", "prompt": text}
            response = requests.post(url, json=data)
            response.raise_for_status()
            embeddings.append(response.json()["embedding"])
        return embeddings
```

```python
class ModelServiceManager:
    def __init__(self):
        self.providers = {}
        self.active_provider = None
    
    def register_provider(self, name: str, provider: LLMProvider):
        self.providers[name] = provider
    
    def set_active_provider(self, name: str):
        if name in self.providers:
            self.active_provider = self.providers[name]
        else:
            raise ValueError(f"Provider {name} not found")
    
    def get_llm_service(self) -> LLMProvider:
        if not self.active_provider:
            raise RuntimeError("No active LLM provider")
        return self.active_provider
```

## 4. 安全与权限示例

```python
import jwt
from datetime import datetime, timedelta
from flask import request, jsonify
from functools import wraps

class AuthService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def generate_token(self, user_id: int, username: str) -> str:
        payload = {
            'user_id': user_id,
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        if token.startswith('Bearer '):
            token = token[7:]
        try:
            request.user = AuthService(current_app.config['SECRET_KEY']).verify_token(token)
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
    return decorated_function
```

```python
from enum import Enum
from functools import wraps

class Permission(Enum):
    READ_NEWS = "read_news"
    WRITE_NEWS = "write_news"
    DELETE_NEWS = "delete_news"
    MANAGE_USERS = "manage_users"
    VIEW_ANALYTICS = "view_analytics"

class Role(Enum):
    USER = "user"
    EDITOR = "editor"
    ADMIN = "admin"

class PermissionService:
    def __init__(self):
        self.role_permissions = {
            Role.USER: [Permission.READ_NEWS],
            Role.EDITOR: [Permission.READ_NEWS, Permission.WRITE_NEWS],
            Role.ADMIN: [Permission.READ_NEWS, Permission.WRITE_NEWS, Permission.DELETE_NEWS, Permission.MANAGE_USERS, Permission.VIEW_ANALYTICS]
        }
    
    def has_permission(self, user_role: str, permission: Permission) -> bool:
        role = Role(user_role)
        return permission in self.role_permissions.get(role, [])

def require_permission(permission: Permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_role = request.user.get('role', 'user')
            if not PermissionService().has_permission(user_role, permission):
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

## 5. 部署与运维配置

```yaml
# docker-compose.yml（示例）
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=sqlite:///app.db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - ollama
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
volumes:
  ollama_data:
```

```nginx
# nginx.conf（要点）
http {
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'";
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    server {
        listen 443 ssl http2;
        server_name your-domain.com;
        location /api/ { proxy_pass http://backend:5000; }
        location / { proxy_pass http://frontend:3000; }
    }
}
```

```python
# 缓存与异步
class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.default_ttl = 3600
    def get_cached_result(self, key: str):
        cached = self.redis.get(key)
        return json.loads(cached) if cached else None
    def set_cached_result(self, key: str, value: Any, ttl: int = None):
        ttl = ttl or self.default_ttl
        self.redis.setex(key, ttl, json.dumps(value))
```

```python
from celery import Celery
from celery.schedules import crontab

celery_app = Celery('news_knowledge_base', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

@celery_app.task
def fetch_rss_feeds():
    pass

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(minute=0), fetch_rss_feeds.s(), name='fetch-rss-every-hour')
```

```python
# 监控指标（Prometheus）
from prometheus_client import Counter, Histogram, Gauge
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_USERS = Gauge('active_users', 'Number of active users')
```


