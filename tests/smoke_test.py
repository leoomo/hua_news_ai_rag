import os
import json
import time
import typing as t

import requests

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000")
USERNAME = os.getenv("API_USERNAME", "admin")
PASSWORD = os.getenv("API_PASSWORD", "admin123")


def _url(path: str) -> str:
    return f"{BASE_URL}{path}"


def login() -> str:
    r = requests.post(_url("/api/auth/login"), json={"username": USERNAME, "password": PASSWORD}, timeout=10)
    r.raise_for_status()
    data = r.json()
    assert data.get("code", 0) == 0, data
    token = data.get("data", {}).get("token")
    assert token, "No token returned"
    return token


def get_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def healthcheck():
    r = requests.get(_url("/api/health"), timeout=5)
    r.raise_for_status()
    assert r.json().get("status") == "ok"


def kb_list(token: str):
    r = requests.get(_url("/api/kb/items?page=1&size=5"), headers=get_headers(token), timeout=10)
    r.raise_for_status()
    data = r.json()
    assert "data" in data, data


def kb_create(token: str):
    payload = {
        "items": [
            {"title": "SmokeTest A", "content": "正文A", "source_name": "SMK", "published_at": "2024-12-01T12:00:00Z", "tags": ["smoke"]},
            {"title": "SmokeTest B", "content": "正文B", "source_name": "SMK", "published_at": "2024-12-01T13:00:00Z", "tags": ["smoke"]},
        ]
    }
    r = requests.post(_url("/api/kb/items"), headers={**get_headers(token), "Content-Type": "application/json"}, json=payload, timeout=15)
    r.raise_for_status()
    data = r.json()
    assert data.get("code", 0) == 0, data


def semantic_search(token: str):
    r = requests.post(_url("/api/search/semantic"), headers={**get_headers(token), "Content-Type": "application/json"}, json={"query": "AI 医疗", "top_k": 5}, timeout=20)
    r.raise_for_status()
    data = r.json()
    assert data.get("code", 0) in (0, 200), data


def qa(token: str):
    r = requests.post(_url("/api/search/qa"), headers={**get_headers(token), "Content-Type": "application/json"}, json={"query": "AI 在医疗影像的作用", "top_k": 5}, timeout=30)
    r.raise_for_status()
    data = r.json()
    assert data.get("code", 0) in (0, 200), data


def analytics(token: str):
    r = requests.get(_url("/api/analytics/keywords?top=5"), headers=get_headers(token), timeout=10)
    r.raise_for_status()
    assert "data" in r.json()


def main():
    print(f"Healthcheck -> {BASE_URL}")
    healthcheck()
    print("Health OK")

    print("Login ...")
    token = login()
    print("Login OK")

    print("KB list ...")
    kb_list(token)
    print("KB list OK")

    print("KB create ...")
    kb_create(token)
    print("KB create OK")

    print("Semantic search ...")
    semantic_search(token)
    print("Semantic search OK")

    print("QA ...")
    qa(token)
    print("QA OK")

    print("Analytics ...")
    analytics(token)
    print("Analytics OK")

    print("All smoke tests passed.")


if __name__ == "__main__":
    main()
