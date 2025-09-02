from __future__ import annotations

import re
from collections import Counter
from typing import List


# sentence split regex (not used directly in summarize_text now)
_SENT_SPLIT = re.compile(r"[。！？.!?]\s*")
_WORD_RE = re.compile(r"[\w\u4e00-\u9fff]{2,}")
_STOPWORDS = set([
    "the","and","for","that","with","from","this","have","has","are","was","were","will",
    "of","to","in","on","at","by","an","a","is","as","it","or","be","we","you",
    "我们","你们","他们","以及","但是","而且","因为","所以","通过","进行","相关","报道","新闻",
])


def summarize_text(text: str, max_chars: int = 200) -> str:
    if not text:
        return ""
    # naive: first N sentences constrained by char limit
    parts = [p.strip() for p in re.split(r"[。！？.!?]\s*", text) if p.strip()]
    summary = []
    total = 0
    for p in parts:
        if total + len(p) > max_chars:
            break
        summary.append(p)
        total += len(p)
    return "。".join(summary)[:max_chars]


def extract_keywords(text: str, top_k: int = 10) -> List[str]:
    if not text:
        return []
    tokens = [t.lower() for t in _WORD_RE.findall(text)]
    tokens = [t for t in tokens if t not in _STOPWORDS and len(t) > 1]
    if not tokens:
        return []
    freq = Counter(tokens)
    return [w for w, _ in freq.most_common(top_k)]


