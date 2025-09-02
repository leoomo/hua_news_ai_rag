from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, scoped_session
from contextlib import contextmanager
from sqlalchemy import text


engine = None
SessionLocal = None


class Base(DeclarativeBase):
    pass


def init_db(database_url: str, settings=None):
    global engine, SessionLocal
    
    # 优化连接池配置，解决连接池耗尽问题
    engine = create_engine(
        database_url, 
        echo=False, 
        future=True,
        # 连接池配置
        pool_size=settings.db_pool_size if settings else 10,           # 基础连接池大小
        max_overflow=settings.db_max_overflow if settings else 20,     # 最大溢出连接数
        pool_timeout=settings.db_pool_timeout if settings else 60,     # 获取连接超时时间
        pool_recycle=settings.db_pool_recycle if settings else 3600,   # 连接回收时间
        pool_pre_ping=True,     # 连接前ping测试
        # 连接配置
        connect_args={
            "timeout": 30,      # SQLite连接超时
            "check_same_thread": False,  # 允许多线程
        } if "sqlite" in database_url else {}
    )
    
    SessionLocal = scoped_session(
        sessionmaker(
            bind=engine, 
            autoflush=False, 
            autocommit=False, 
            expire_on_commit=False
        )
    )


def get_session():
    if SessionLocal is None:
        raise RuntimeError('DB not initialized')
    return SessionLocal()


@contextmanager
def get_db_session():
    """数据库会话上下文管理器，确保连接正确释放"""
    session = get_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def close_db():
    """关闭数据库连接"""
    global engine, SessionLocal
    if SessionLocal:
        SessionLocal.remove()
    if engine:
        engine.dispose()


def ensure_columns_for_enrich():
    """确保数据库表有摘要和关键词列"""
    try:
        with engine.connect() as conn:
            # 检查并添加summary列
            try:
                conn.execute(text("ALTER TABLE news_articles ADD COLUMN summary TEXT"))
                print("Added summary column to news_articles")
            except Exception:
                pass  # 列已存在
            
            # 检查并添加keywords列
            try:
                conn.execute(text("ALTER TABLE news_articles ADD COLUMN keywords TEXT"))
                print("Added keywords column to news_articles")
            except Exception:
                pass  # 列已存在
                
            conn.commit()
    except Exception as e:
        print(f"Error ensuring enrich columns: {e}")


