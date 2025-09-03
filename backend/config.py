from pydantic import BaseModel
import os


class Settings(BaseModel):
    database_url: str = os.getenv('DATABASE_URL', f'sqlite:///{os.path.abspath("../hua_news.db")}')
    secret_key: str = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # 数据库连接池配置
    db_pool_size: int = int(os.getenv('DB_POOL_SIZE', '10'))
    db_max_overflow: int = int(os.getenv('DB_MAX_OVERFLOW', '20'))
    db_pool_timeout: int = int(os.getenv('DB_POOL_TIMEOUT', '60'))
    db_pool_recycle: int = int(os.getenv('DB_POOL_RECYCLE', '3600'))
    
    # Ingestion settings
    fetch_timeout_sec: int = int(os.getenv('FETCH_TIMEOUT_SEC', '8'))
    fetch_retries: int = int(os.getenv('FETCH_RETRIES', '3'))
    rate_limit_domain_qps: float = float(os.getenv('RATE_LIMIT_DOMAIN_QPS', '1'))
    enable_enrich: bool = os.getenv('ENABLE_ENRICH', 'true').lower() == 'true'
    enable_embed: bool = os.getenv('ENABLE_EMBED', 'true').lower() == 'true'
    embed_batch_size: int = int(os.getenv('EMBED_BATCH_SIZE', '64'))
    chunk_size: int = int(os.getenv('CHUNK_SIZE', '800'))
    chunk_overlap: int = int(os.getenv('CHUNK_OVERLAP', '120'))
    simhash_hamming_threshold: int = int(os.getenv('SIMHASH_HAMMING_THRESHOLD', '4'))


