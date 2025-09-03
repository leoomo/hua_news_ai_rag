#!/usr/bin/env python3
"""
Quick exporter: build a minimal OpenAPI 3.0 spec by introspecting Flask routes.

Usage:
  uv run python backend/scripts/export_openapi.py  # writes doc/openapi.generated.yaml
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.core.app import create_app  # type: ignore


def to_openapi_path(rule: str) -> str:
    # Flask style '/api/kb/items/<int:id>' -> OpenAPI '/api/kb/items/{id}'
    import re
    return re.sub(r"<[^:>]+:([^>]+)>|<([^>]+)>", lambda m: f"{{{m.group(1) or m.group(2)}}}", rule)


def infer_method_summary(endpoint: str, rule: str) -> str:
    if endpoint:
        return endpoint.replace('_', ' ')
    return rule


def build_spec(app) -> Dict[str, Any]:
    info = {
        "title": "Hua News AI RAG API",
        "version": "1.0.0",
        "description": "Auto-generated minimal OpenAPI spec from Flask routes.",
    }
    servers = [{"url": os.getenv("API_BASE_URL", "http://localhost:5050")}]
    paths: Dict[str, Any] = {}

    for rule in app.url_map.iter_rules():
        # Skip static or internal endpoints
        if rule.endpoint == 'static':
            continue
        methods = sorted(m for m in rule.methods if m in {"GET", "POST", "PUT", "PATCH", "DELETE"})
        if not methods:
            continue
        path = to_openapi_path(str(rule))
        if path not in paths:
            paths[path] = {}
        for m in methods:
            paths[path][m.lower()] = {
                "summary": infer_method_summary(rule.endpoint, path),
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "code": {"type": "integer"},
                                        "data": {"type": "object"},
                                        "msg": {"type": "string"},
                                    },
                                }
                            }
                        },
                    }
                },
            }

    return {
        "openapi": "3.0.3",
        "info": info,
        "servers": servers,
        "paths": paths,
    }


def dump_yaml(obj: Dict[str, Any]) -> str:
    try:
        import yaml  # type: ignore
        return yaml.safe_dump(obj, sort_keys=False, allow_unicode=True)
    except Exception:
        # Fallback minimal YAML dumper
        import json
        return json.dumps(obj, ensure_ascii=False, indent=2)


def main() -> None:
    app = create_app()
    spec = build_spec(app)
    out_dir = PROJECT_ROOT / "doc"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "openapi.generated.yaml"
    out_file.write_text(dump_yaml(spec), encoding="utf-8")
    print(f"✅ OpenAPI spec written to {out_file}")


if __name__ == "__main__":
    main()


