from datetime import timedelta
from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler
import os
from flask_cors import CORS
from .config import Settings
from .db import init_db, engine, Base
from .ingest_utils import ensure_columns_for_dedup, ensure_columns_for_enrich
from .routes.auth import auth_bp
from .routes.users import users_bp
from .routes.rss import rss_bp
from .routes.kb import kb_bp
from .routes.models_settings import models_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, supports_credentials=True)

    settings = Settings()
    app.config['SECRET_KEY'] = settings.secret_key
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

    init_db(settings.database_url)
    # import models so SQLAlchemy knows all tables
    try:
        from backend import models as _models  # noqa: F401
    except Exception:
        try:
            from . import models as _models  # type: ignore # noqa: F401
        except Exception:
            pass
    # ensure all tables exist (long-term approach)
    try:
        Base.metadata.create_all(engine)
    except Exception:
        pass
    # ensure schema columns once at startup
    try:
        ensure_columns_for_dedup()
        ensure_columns_for_enrich()
    except Exception:
        pass

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(rss_bp, url_prefix='/api/settings')
    app.register_blueprint(kb_bp, url_prefix='/api')
    app.register_blueprint(models_bp, url_prefix='/api/settings')

    # background scheduler for periodic ingest
    try:
        scheduler = BackgroundScheduler(daemon=True, timezone='UTC')
        try:
            from backend.routes.rss import ingest_all_sources
        except Exception:
            from .routes.rss import ingest_all_sources  # type: ignore

        def _job():
            try:
                ingest_all_sources()
            except Exception:
                pass

        scheduler.add_job(_job, 'interval', minutes=30, id='rss_ingest_all', replace_existing=True)
        scheduler.start()
        app.config['scheduler'] = scheduler
    except Exception:
        pass

    @app.get('/api/health')
    def health():
        return {'status': 'ok'}

    return app


if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=True)


