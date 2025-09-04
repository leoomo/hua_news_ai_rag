-- 华新AI知识库系统 - 数据库初始化脚本
-- 包含所有表结构和默认数据

PRAGMA foreign_keys = ON;

-- ==============================================
-- 1. 基础用户表
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'zh-CN',
    email_verified BOOLEAN DEFAULT 0,
    phone_verified BOOLEAN DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- ==============================================
-- 2. 用户角色权限表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions TEXT,  -- JSON格式的权限列表
    is_system_role BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 3. 用户配置和偏好设置表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,  -- JSON格式
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, preference_key)
);

-- ==============================================
-- 4. 用户活动日志表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details TEXT,  -- JSON格式
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==============================================
-- 5. 用户会话管理表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- 6. 用户组表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==============================================
-- 7. 用户组成员关系表
-- ==============================================
CREATE TABLE IF NOT EXISTS user_group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

-- ==============================================
-- 8. 新闻文章表
-- ==============================================
CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_url VARCHAR(500),
    source_name VARCHAR(100),
    published_at TIMESTAMP,
    category VARCHAR(50),
    tags TEXT,
    importance_score REAL DEFAULT 0.0,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vector_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
);

-- ==============================================
-- 9. RSS源表
-- ==============================================
CREATE TABLE IF NOT EXISTS rss_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    last_fetch TIMESTAMP,
    fetch_interval INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 10. 采集日志表
-- ==============================================
CREATE TABLE IF NOT EXISTS ingest_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER,
    url VARCHAR(500),
    status VARCHAR(20) NOT NULL,
    created INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE SET NULL
);

-- ==============================================
-- 11. 查询日志表
-- ==============================================
CREATE TABLE IF NOT EXISTS query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    query_text TEXT NOT NULL,
    query_type VARCHAR(20),
    result_count INTEGER,
    response_time REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==============================================
-- 12. 文章分块表
-- ==============================================
CREATE TABLE IF NOT EXISTS article_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    vector_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
    UNIQUE(article_id, chunk_index)
);

-- ==============================================
-- 13. 邮件配置表
-- ==============================================
CREATE TABLE IF NOT EXISTS email_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enable_email_module BOOLEAN DEFAULT 0,
    enable_email_notification BOOLEAN DEFAULT 1,
    recipient_emails TEXT,  -- JSON数组
    sender_name VARCHAR(100) DEFAULT '华新AI知识库系统',
    sender_email VARCHAR(100),
    sender_password VARCHAR(255),
    email_provider VARCHAR(50) DEFAULT '163',
    custom_smtp_config TEXT,  -- JSON对象
    max_articles_in_email INTEGER DEFAULT 10,
    email_template_language VARCHAR(10) DEFAULT 'zh_cn',
    email_format VARCHAR(20) DEFAULT 'markdown',
    email_send_timeout INTEGER DEFAULT 30,
    email_retry_count INTEGER DEFAULT 3,
    email_retry_delay INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 14. 模型配置表
-- ==============================================
CREATE TABLE IF NOT EXISTS model_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    llm VARCHAR(100) NOT NULL DEFAULT 'qwen2.5:3b',
    embedding VARCHAR(200) NOT NULL DEFAULT 'sentence-transformers/all-MiniLM-L6-v2',
    reranker VARCHAR(200),
    ollama_url VARCHAR(200) DEFAULT 'http://localhost:11434',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- 创建索引
-- ==============================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 新闻文章表索引
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news_articles(created_at);

-- RSS源表索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_rss_url ON rss_sources(url);
CREATE INDEX IF NOT EXISTS idx_rss_active ON rss_sources(is_active);

-- 查询日志表索引
CREATE INDEX IF NOT EXISTS idx_query_user ON query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_query_created ON query_logs(created_at);

-- 文章分块表索引
CREATE INDEX IF NOT EXISTS idx_chunks_article ON article_chunks(article_id);

-- 用户管理相关索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(group_id);

-- 采集日志表索引
CREATE INDEX IF NOT EXISTS idx_ingest_logs_source_id ON ingest_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_ingest_logs_created_at ON ingest_logs(created_at);

-- ==============================================
-- 插入默认数据
-- ==============================================

-- 插入默认角色
INSERT OR IGNORE INTO user_roles (id, name, display_name, description, permissions, is_system_role) VALUES
(1, 'admin', '系统管理员', '拥有系统所有权限', '["user:read", "user:write", "user:delete", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete", "system:read", "system:write"]', 1),
(2, 'editor', '内容编辑者', '可以管理新闻内容和RSS源', '["user:read", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete"]', 1),
(3, 'user', '普通用户', '可以查看和搜索新闻内容', '["article:read", "search:read"]', 1),
(4, 'guest', '访客', '只能查看公开内容', '["article:read"]', 1);

-- 插入默认用户组
INSERT OR IGNORE INTO user_groups (id, name, description) VALUES
(1, '系统管理员组', '系统管理员专用组'),
(2, '内容编辑组', '负责内容编辑的用户组'),
(3, '普通用户组', '普通用户组');

-- 插入默认用户（密码为明文，生产环境需要加密）
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, full_name, department, is_active) VALUES
(1, 'admin', 'admin@example.com', 'admin123', 'admin', '系统管理员', 'IT', 1),
(2, 'editor', 'editor@example.com', 'editor123', 'editor', '内容编辑', '编辑部', 1),
(3, 'user', 'user@example.com', 'user123', 'user', '普通用户', '用户组', 1);

-- 插入默认RSS源
INSERT OR IGNORE INTO rss_sources (id, name, url, category, is_active, fetch_interval) VALUES
(1, '新华社', 'https://www.xinhuanet.com/rss', 'china', 1, 3600),
(2, 'BBC World', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'world', 1, 3600),
(3, 'Reuters Top', 'http://feeds.reuters.com/reuters/topNews', 'world', 1, 3600),
(4, 'BBC News', 'http://feeds.bbci.co.uk/news/rss.xml', 'world', 1, 3600);

-- 插入默认邮件配置
INSERT OR IGNORE INTO email_configs (id, enable_email_module, enable_email_notification, recipient_emails, sender_name, sender_email, sender_password, email_provider, custom_smtp_config, max_articles_in_email, email_template_language, email_format, email_send_timeout, email_retry_count, email_retry_delay) VALUES
(1, 0, 1, '[]', '华新AI知识库系统', '', '', '163', '{"smtp_host": "smtp.163.com", "smtp_port": 465, "smtp_use_tls": false, "smtp_use_ssl": true}', 10, 'zh_cn', 'markdown', 30, 3, 5);

-- 插入默认模型配置
INSERT OR IGNORE INTO model_configs (id, llm, embedding, reranker, ollama_url) VALUES
(1, 'qwen2.5:3b', 'sentence-transformers/all-MiniLM-L6-v2', 'ms-marco-MiniLM-L-6-v2', 'http://localhost:11434');

-- 插入示例新闻文章
INSERT OR IGNORE INTO news_articles (id, title, content, source_url, source_name, published_at, category, tags, importance_score, summary, status) VALUES
(1, '国内经济数据发布：消费与投资回升', '统计局发布最新经济数据，消费与投资呈现回升趋势，市场信心增强。详细数据显示，消费支出同比增长8.5%，固定资产投资增长12.3%，表明经济复苏态势良好。', 'https://example.com/news/1', '新华社', datetime('now', '-1 day'), 'economy', '["经济","投资","消费"]', 0.82, '统计局发布最新经济数据，消费与投资呈现回升趋势，市场信心增强。', 'active'),
(2, '科技公司推出新一代AI模型', '某科技公司宣布推出新一代AI模型，在推理和多语言方面有显著提升。该模型在多个基准测试中表现优异，预计将推动AI技术在各行业的应用。', 'https://example.com/news/2', 'Reuters', datetime('now', '-2 days'), 'technology', '["AI","模型","发布"]', 0.91, '某科技公司宣布推出新一代AI模型，在推理和多语言方面有显著提升。', 'active'),
(3, '国际油价持续波动', '受地缘政治因素影响，国际油价出现持续波动。分析师认为，未来几个月油价走势将取决于全球供需平衡和地缘政治局势的发展。', 'https://example.com/news/3', 'BBC News', datetime('now', '-3 days'), 'economy', '["油价","地缘政治","能源"]', 0.75, '受地缘政治因素影响，国际油价出现持续波动。', 'active');

-- 插入示例文章分块
INSERT OR IGNORE INTO article_chunks (id, article_id, chunk_index, content) VALUES
(1, 1, 0, '统计局发布最新经济数据，消费与投资呈现回升趋势，市场信心增强。'),
(2, 1, 1, '详细数据显示，消费支出同比增长8.5%，固定资产投资增长12.3%，表明经济复苏态势良好。'),
(3, 2, 0, '某科技公司宣布推出新一代AI模型，在推理和多语言方面有显著提升。'),
(4, 2, 1, '该模型在多个基准测试中表现优异，预计将推动AI技术在各行业的应用。');

-- 插入示例用户偏好
INSERT OR IGNORE INTO user_preferences (user_id, preference_key, preference_value) VALUES
(1, 'theme', '"dark"'),
(1, 'language', '"zh_cn"'),
(1, 'notifications', '{"email": true, "push": false}'),
(2, 'theme', '"light"'),
(2, 'language', '"zh_cn"'),
(3, 'theme', '"auto"'),
(3, 'language', '"en"');

-- 插入示例活动日志
INSERT OR IGNORE INTO user_activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent) VALUES
(1, 'login', 'user', 1, '{"method": "password"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(1, 'create', 'article', 1, '{"title": "国内经济数据发布：消费与投资回升"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, 'login', 'user', 2, '{"method": "password"}', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

-- 插入示例采集日志
INSERT OR IGNORE INTO ingest_logs (source_id, url, status, created, skipped, created_at) VALUES
(1, 'https://www.xinhuanet.com/rss', 'success', 3, 0, datetime('now', '-1 hour')),
(2, 'http://feeds.bbci.co.uk/news/world/rss.xml', 'success', 5, 2, datetime('now', '-2 hours')),
(3, 'http://feeds.reuters.com/reuters/topNews', 'success', 4, 1, datetime('now', '-3 hours'));

-- 插入示例查询日志
INSERT OR IGNORE INTO query_logs (user_id, query_text, query_type, result_count, response_time, created_at) VALUES
(1, '经济数据', 'semantic', 2, 0.5, datetime('now', '-30 minutes')),
(2, 'AI模型', 'semantic', 1, 0.3, datetime('now', '-1 hour')),
(3, '油价', 'semantic', 1, 0.4, datetime('now', '-2 hours'));

-- ==============================================
-- 完成初始化
-- ==============================================
-- 显示初始化完成信息
SELECT 'Database initialization completed successfully!' as message;
