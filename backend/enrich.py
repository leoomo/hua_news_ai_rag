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
    
    # 处理特殊格式：标题：xxx 来源：xxx 链接：xxx
    if "标题：" in text and "来源：" in text:
        # 提取标题部分作为摘要
        title_match = re.search(r"标题：([^来源]+)", text)
        if title_match:
            title = title_match.group(1).strip()
            # 如果标题太长，截取前N个字符
            if len(title) > max_chars:
                return title[:max_chars-3] + "..."
            return title
    
    # 处理普通文本：按句子分割
    parts = [p.strip() for p in re.split(r"[。！？.!?]\s*", text) if p.strip()]
    if parts:
        summary = []
        total = 0
        for p in parts:
            if total + len(p) > max_chars:
                # 如果单个部分就超过限制，截取这个部分
                if total == 0:
                    return p[:max_chars-3] + "..."
                break
            summary.append(p)
            total += len(p)
        
        if summary:
            return "。".join(summary)[:max_chars]
    
    # 如果没有句号或分割失败，按长度截取
    if len(text) <= max_chars:
        return text
    else:
        return text[:max_chars-3] + "..."


def extract_keywords(text: str, top_k: int = 10) -> List[str]:
    if not text:
        return []
    tokens = [t.lower() for t in _WORD_RE.findall(text)]
    tokens = [t for t in tokens if t not in _STOPWORDS and len(t) > 1]
    if not tokens:
        return []
    freq = Counter(tokens)
    return [w for w, _ in freq.most_common(top_k)]


