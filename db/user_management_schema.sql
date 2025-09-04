-- 用户管理功能扩展数据库结构
-- 基于现有 users 表的增强设计

PRAGMA foreign_keys = ON;

-- 1. 用户角色权限表
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,  -- 角色名称: admin, editor, user, guest
    display_name VARCHAR(100) NOT NULL, -- 显示名称: 管理员, 编辑者, 用户, 访客
    description TEXT,                   -- 角色描述
    permissions TEXT,                   -- JSON格式的权限列表
    is_system_role BOOLEAN DEFAULT 0,   -- 是否为系统内置角色
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户配置和偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preference_key VARCHAR(100) NOT NULL,  -- 配置键名
    preference_value TEXT,                 -- 配置值(JSON格式)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, preference_key)
);

-- 3. 用户活动日志表
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,          -- 操作类型: login, logout, create, update, delete, search, etc.
    resource_type VARCHAR(50),             -- 资源类型: user, article, rss_source, etc.
    resource_id INTEGER,                   -- 资源ID
    details TEXT,                          -- 详细信息(JSON格式)
    ip_address VARCHAR(45),                -- IP地址
    user_agent TEXT,                       -- 用户代理
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. 用户会话管理表
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

-- 5. 用户组表
CREATE TABLE IF NOT EXISTS user_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. 用户组成员关系表
CREATE TABLE IF NOT EXISTS user_group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member',     -- member, admin
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
);

-- 7. 用户通知设置表
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- email, push, in_app
    event_type VARCHAR(100) NOT NULL,       -- new_article, system_update, etc.
    is_enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, notification_type, event_type)
);

-- 8. 用户API密钥表
CREATE TABLE IF NOT EXISTS user_api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT,                       -- JSON格式的API权限
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 扩展现有 users 表
-- 注意：这些字段需要在实际部署时通过 ALTER TABLE 添加

-- ALTER TABLE users ADD COLUMN full_name VARCHAR(100);
-- ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
-- ALTER TABLE users ADD COLUMN phone VARCHAR(20);
-- ALTER TABLE users ADD COLUMN department VARCHAR(100);
-- ALTER TABLE users ADD COLUMN position VARCHAR(100);
-- ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
-- ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'zh-CN';
-- ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;
-- ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0;
-- ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0;
-- ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
-- ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
-- ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key ON user_api_keys(api_key);

-- 插入默认角色数据
INSERT OR IGNORE INTO user_roles (name, display_name, description, permissions, is_system_role) VALUES
('admin', '系统管理员', '拥有系统所有权限', '["user:read", "user:write", "user:delete", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete", "system:read", "system:write"]', 1),
('editor', '内容编辑者', '可以管理新闻内容和RSS源', '["user:read", "article:read", "article:write", "article:delete", "rss:read", "rss:write", "rss:delete"]', 1),
('user', '普通用户', '可以查看和搜索新闻内容', '["article:read", "search:read"]', 1),
('guest', '访客', '只能查看公开内容', '["article:read"]', 1);

-- 插入默认用户组
INSERT OR IGNORE INTO user_groups (id, name, description) VALUES
(1, '系统管理员组', '系统管理员专用组'),
(2, '内容编辑组', '负责内容编辑的用户组'),
(3, '普通用户组', '普通用户组');
