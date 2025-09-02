from __future__ import annotations

import time
import threading
import urllib.parse
import urllib.robotparser as robotparser
from dataclasses import dataclass
from typing import Dict, Optional

import requests

from .config import Settings


@dataclass
class DomainState:
    robots: robotparser.RobotFileParser
    last_request_ts: float = 0.0
    qps: float = 1.0


class Fetcher:
    def __init__(self, settings: Optional[Settings] = None, user_agent: str = "hua-news-fetcher/0.1"):
        self.settings = settings or Settings()
        self.user_agent = user_agent
        self._lock = threading.Lock()
        self._domains: Dict[str, DomainState] = {}

    def _get_domain(self, url: str) -> str:
        return urllib.parse.urlparse(url).netloc.lower()

    def _load_robots(self, base_url: str) -> robotparser.RobotFileParser:
        domain = self._get_domain(base_url)
        with self._lock:
            state = self._domains.get(domain)
            if state and state.robots.mtime() and (time.time() - state.robots.mtime()) < 3600:
                return state.robots
        robots_url = urllib.parse.urljoin(f"https://{domain}", "/robots.txt")
        rp = robotparser.RobotFileParser()
        try:
            rp.set_url(robots_url)
            rp.read()
        except Exception:
            # Fail-open if robots unavailable
            rp.parse("")
        with self._lock:
            self._domains[domain] = DomainState(robots=rp, last_request_ts=0.0, qps=self.settings.rate_limit_domain_qps)
        return rp

    def can_fetch(self, url: str) -> bool:
        rp = self._load_robots(url)
        try:
            return rp.can_fetch(self.user_agent, url)
        except Exception:
            return True

    def _respect_rate_limit(self, domain: str):
        with self._lock:
            state = self._domains.get(domain)
            if not state:
                state = DomainState(robots=robotparser.RobotFileParser(), last_request_ts=0.0, qps=self.settings.rate_limit_domain_qps)
                self._domains[domain] = state
            now = time.time()
            min_interval = 1.0 / max(state.qps, 0.1)
            sleep_sec = state.last_request_ts + min_interval - now
            if sleep_sec > 0:
                time.sleep(sleep_sec)
            state.last_request_ts = time.time()

    def get(self, url: str, timeout: Optional[int] = None) -> requests.Response:
        if not self.can_fetch(url):
            raise PermissionError(f"Blocked by robots.txt: {url}")
        domain = self._get_domain(url)
        self._respect_rate_limit(domain)
        headers = {"User-Agent": self.user_agent, "Accept": "*/*"}
        resp = requests.get(url, headers=headers, timeout=timeout or self.settings.fetch_timeout_sec)
        resp.raise_for_status()
        return resp


