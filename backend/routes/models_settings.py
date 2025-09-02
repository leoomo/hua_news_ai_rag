from flask import Blueprint, request

models_bp = Blueprint('models_settings', __name__)

# In-memory config for demo; replace with persistent storage as needed
_cfg = {
    'llm': 'qwen2.5:3b',
    'embedding': 'sentence-transformers/all-MiniLM-L6-v2',
    'reranker': 'ms-marco-MiniLM-L-6-v2',
    'ollama_url': 'http://localhost:11434'
}


@models_bp.get('/models')
def get_models():
    return {'code': 0, 'data': _cfg}


@models_bp.put('/models')
def update_models():
    data = request.get_json(force=True) or {}
    _cfg.update({
        'llm': data.get('llm', _cfg['llm']),
        'embedding': data.get('embedding', _cfg['embedding']),
        'reranker': data.get('reranker', _cfg.get('reranker')),
        'ollama_url': data.get('ollama_url', _cfg.get('ollama_url')),
    })
    return {'code': 0, 'data': _cfg}


