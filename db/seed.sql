-- Seed data for HUA News AI RAG
PRAGMA foreign_keys = ON;

-- users (password_hash here is plaintext placeholder; replace with bcrypt in production)
INSERT INTO users (username, email, password_hash, role, is_active)
VALUES
  ('admin', 'admin@example.com', 'admin123', 'admin', 1),
  ('editor', 'editor@example.com', 'editor123', 'editor', 1),
  ('user', 'user@example.com', 'user123', 'user', 1);

-- rss_sources
INSERT INTO rss_sources (name, url, category, is_active, fetch_interval)
VALUES
  ('新华社', 'https://www.xinhuanet.com/rss', 'china', 1, 3600),
  ('BBC World', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'world', 1, 3600),
  ('Reuters Top', 'http://feeds.reuters.com/reuters/topNews', 'world', 1, 3600);

-- news_articles (sample)
INSERT INTO news_articles (title, content, source_url, source_name, published_at, category, tags, importance_score, status)
VALUES
  (
    '国内经济数据发布：消费与投资回升',
    '统计局发布最新经济数据，消费与投资呈现回升趋势，市场信心增强。',
    'https://example.com/news/1',
    '新华社',
    datetime('now', '-1 day'),
    'economy',
    json('["经济","投资","消费"]'),
    0.82,
    'active'
  ),
  (
    '科技公司推出新一代AI模型',
    '某科技公司宣布推出新一代AI模型，在推理和多语言方面有显著提升。',
    'https://example.com/news/2',
    'Reuters',
    datetime('now', '-2 days'),
    'technology',
    json('["AI","模型","发布"]'),
    0.91,
    'active'
  );

-- article_chunks (optional examples)
INSERT INTO article_chunks (article_id, chunk_index, content)
VALUES
  (1, 0, '统计局发布最新经济数据...（分块1）'),
  (1, 1, '消费与投资呈现回升趋势...（分块2）');


