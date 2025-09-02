from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, scoped_session


engine = None
SessionLocal = None


class Base(DeclarativeBase):
    pass


def init_db(database_url: str):
    global engine, SessionLocal
    engine = create_engine(database_url, echo=False, future=True)
    SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False))


def get_session():
    if SessionLocal is None:
        raise RuntimeError('DB not initialized')
    return SessionLocal()


