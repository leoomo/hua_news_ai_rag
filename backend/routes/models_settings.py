from flask import Blueprint, request
from data.db import get_db_session
from data.model_config_models import ModelConfig

models_bp = Blueprint('models_settings', __name__)


@models_bp.get('/models')
def get_models():
    """获取模型配置"""
    try:
        with get_db_session() as session:
            config = session.query(ModelConfig).first()
            if not config:
                # 如果没有配置，创建默认配置
                config = ModelConfig()
                session.add(config)
                session.commit()
            
            return {
                'code': 0, 
                'data': {
                    'llm': config.llm,
                    'embedding': config.embedding,
                    'reranker': config.reranker,
                    'ollama_url': config.ollama_url
                }
            }
    except Exception as e:
        return {'code': 500, 'msg': f'获取模型配置失败: {str(e)}'}, 500


@models_bp.put('/models')
def update_models():
    """更新模型配置"""
    try:
        data = request.get_json(force=True) or {}
        
        with get_db_session() as session:
            config = session.query(ModelConfig).first()
            if not config:
                config = ModelConfig()
                session.add(config)
            
            # 更新配置
            if 'llm' in data:
                config.llm = data['llm']
            if 'embedding' in data:
                config.embedding = data['embedding']
            if 'reranker' in data:
                config.reranker = data.get('reranker')
            if 'ollama_url' in data:
                config.ollama_url = data.get('ollama_url', 'http://localhost:11434')
            
            session.commit()
            
            return {
                'code': 0, 
                'data': {
                    'llm': config.llm,
                    'embedding': config.embedding,
                    'reranker': config.reranker,
                    'ollama_url': config.ollama_url
                }
            }
    except Exception as e:
        return {'code': 500, 'msg': f'更新模型配置失败: {str(e)}'}, 500


