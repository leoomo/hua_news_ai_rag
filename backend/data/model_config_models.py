from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from .db import Base


class ModelConfig(Base):
    """模型配置表"""
    __tablename__ = 'model_configs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    llm: Mapped[str] = mapped_column(String(100), nullable=False, default='qwen2.5:3b')
    embedding: Mapped[str] = mapped_column(String(200), nullable=False, default='sentence-transformers/all-MiniLM-L6-v2')
    reranker: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ollama_url: Mapped[str] = mapped_column(String(200), default='http://localhost:11434')
    
    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
