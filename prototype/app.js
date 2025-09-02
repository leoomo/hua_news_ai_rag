"use strict";

// State
const state = {
  user: null,
  kb: [],
  rss: [],
  users: [],
  stats: { ingest: 3, pending: 1, queries: 12, failed: 0 },
  models: {
    ollamaUrl: "http://localhost:11434",
    llmModel: "qwen2.5:3b",
    embModel: "sentence-transformers/all-MiniLM-L6-v2",
    rerankModel: "ms-marco-MiniLM-L-6-v2"
  }
};

// Mock seed data
function seed() {
  state.kb = [
    { id: 1, title: "AI助力医疗影像诊断提速", source: "新华社", tags: ["AI","医疗"], published_at: "2024-12-01", content: "人工智能在医疗影像领域加速落地。\n模型通过学习海量数据辅助医生诊断，显著提升效率与准确率。\n多机构联合发布最新指南，强调人机协同与质量控制。" },
    { id: 2, title: "新能源车市11月销量创新高", source: "人民网", tags: ["汽车","能源"], published_at: "2024-11-30", content: "国内新能源车渗透率持续提升，供应链稳定性增强。\n多地出台消费促进政策，充电基础设施覆盖进一步扩大。" },
    { id: 3, title: "大模型赋能政务服务提效", source: "央视网", tags: ["政务","大模型"], published_at: "2024-11-29", content: "大模型在政务问答、材料生成、流程优化方面表现突出。\n试点城市上线智能咨询平台，用户满意度提升。" },
  ];
  state.rss = [
    { id: 1, name: "新华网-科技", url: "https://www.xinhuanet.com/rss/tech.xml", category: "科技", active: true, last_fetch: "2024-12-01 09:00" },
    { id: 2, name: "人民网-财经", url: "https://www.people.com.cn/rss/finance.xml", category: "财经", active: true, last_fetch: "2024-12-01 08:30" },
  ];
  state.users = [
    { id: 1, username: "admin", email: "admin@example.com", role: "admin", last_login: "2024-12-01 10:00" },
    { id: 2, username: "editor", email: "editor@example.com", role: "editor", last_login: "2024-11-30 18:40" },
  ];
}

// Utilities
function qs(sel, el=document) { return el.querySelector(sel); }
function qsa(sel, el=document) { return Array.from(el.querySelectorAll(sel)); }
function showNotice(msg, timeout=2000) {
  const n = qs('#notice');
  n.textContent = msg;
  n.classList.remove('hidden');
  setTimeout(()=> n.classList.add('hidden'), timeout);
}

// Navigation
function switchView(name) {
  qsa('.view').forEach(v=> v.classList.remove('visible'));
  const el = qs(`#view-${name}`);
  if (el) el.classList.add('visible');
  qsa('.nav-item').forEach(b=> b.classList.toggle('active', b.dataset.view===name));
}

function bindNav() {
  qsa('.nav-item').forEach(btn=> btn.addEventListener('click', ()=> switchView(btn.dataset.view)));
}

// Auth
function bindAuth() {
  const loginBtn = qs('#loginBtn');
  const modal = qs('#loginModal');
  const close = qs('#closeLogin');
  loginBtn.addEventListener('click', ()=> modal.classList.remove('hidden'));
  close.addEventListener('click', ()=> modal.classList.add('hidden'));
  qs('#loginForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const username = qs('#username').value.trim();
    const password = qs('#password').value.trim();
    if (!username || !password) return;
    state.user = { username, role: username === 'admin' ? 'admin' : 'user' };
    qs('#userArea').innerHTML = `<span>欢迎，${username}</span>`;
    modal.classList.add('hidden');
    showNotice('登录成功');
  });
}

// Dashboard
function renderDashboard() {
  qs('#statIngest').textContent = state.stats.ingest;
  qs('#statPending').textContent = state.stats.pending;
  qs('#statQueries').textContent = state.stats.queries;
  qs('#statFailed').textContent = state.stats.failed;
  const tbody = qs('#recentTable tbody');
  tbody.innerHTML = state.kb.slice(0,5).map(a=>
    `<tr><td>${a.title}</td><td>${a.source}</td><td>${a.published_at}</td></tr>`
  ).join('');
}

// Knowledge Base list
function renderKB(items=state.kb) {
  const tbody = qs('#kbTable tbody');
  tbody.innerHTML = items.map(a=>
    `<tr>
      <td><input type="checkbox" class="rowChk" data-id="${a.id}"></td>
      <td><a href="#" data-detail="${a.id}">${a.title}</a></td>
      <td>${a.source}</td>
      <td>${(a.tags||[]).join(', ')}</td>
      <td>${a.published_at||''}</td>
      <td>
        <button class="small" data-action="edit" data-id="${a.id}">编辑</button>
        <button class="small danger" data-action="del" data-id="${a.id}">删除</button>
      </td>
    </tr>`
  ).join('');
  updateBatchButton();
}

function bindKB() {
  qs('#btnFilter').addEventListener('click', ()=>{
    const kw = qs('#fKeyword').value.trim();
    const src = qs('#fSource').value;
    const from = qs('#fFrom').value;
    const to = qs('#fTo').value;
    const filtered = state.kb.filter(a=>{
      const okKw = !kw || a.title.includes(kw);
      const okSrc = !src || a.source===src;
      const t = a.published_at || '';
      const okFrom = !from || t >= from;
      const okTo = !to || t <= to;
      return okKw && okSrc && okFrom && okTo;
    });
    renderKB(filtered);
  });
  qs('#kbTable').addEventListener('click', (e)=>{
    const link = e.target.closest('[data-detail]');
    if (link){
      const id = Number(link.dataset.detail);
      openDetail(id);
      e.preventDefault();
      return;
    }
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.action==='del') {
      if (!confirm('删除后不可恢复，确认？')) return;
      state.kb = state.kb.filter(a=> a.id!==id);
      renderKB();
      showNotice('已删除');
    }
    if (btn.dataset.action==='edit') {
      const it = state.kb.find(x=> x.id===id);
      const newTags = prompt('编辑标签（逗号分隔）', (it.tags||[]).join(','));
      if (newTags!==null) {
        it.tags = newTags.split(',').map(s=>s.trim()).filter(Boolean);
        renderKB();
        showNotice('已保存');
      }
    }
  });
  qs('#chkAll').addEventListener('change', (e)=>{
    qsa('.rowChk').forEach(c=> c.checked = e.target.checked);
    updateBatchButton();
  });
  qs('#kbTable').addEventListener('change', (e)=>{
    if (e.target.classList.contains('rowChk')) updateBatchButton();
  });
  qs('#btnBatchDelete').addEventListener('click', ()=>{
    const ids = qsa('.rowChk:checked').map(c=> Number(c.dataset.id));
    if (!ids.length) return;
    if (!confirm(`确定删除选中 ${ids.length} 条？`)) return;
    state.kb = state.kb.filter(a=> !ids.includes(a.id));
    renderKB();
    showNotice('批量删除完成');
  });
  qs('#btnImport').addEventListener('click', ()=>{
    showNotice('模拟导入成功，新增3条');
    const nextId = Math.max(...state.kb.map(a=>a.id))+1;
    for (let i=0;i<3;i++) state.kb.push({ id: nextId+i, title: `导入条目 ${i+1}`, source: '导入', tags: ['导入'], published_at: '2024-12-01', content: '导入内容 ' + (i+1) });
    renderKB();
  });
  qs('#closeDetail').addEventListener('click', ()=> qs('#detailModal').classList.add('hidden'));
}

function updateBatchButton(){
  const any = qsa('.rowChk:checked').length>0;
  qs('#btnBatchDelete').disabled = !any;
}

// KB Detail with chunking
function splitToChunks(text, size=80, overlap=20){
  const res = [];
  let i = 0;
  while (i < text.length){
    const end = Math.min(text.length, i+size);
    res.push(text.slice(i, end));
    i = end - overlap;
    if (i < 0) i = 0;
    if (i >= text.length) break;
  }
  return res;
}

function openDetail(id){
  const it = state.kb.find(x=> x.id===id);
  if (!it) return;
  qs('#detailTitle').textContent = it.title;
  qs('#detailMeta').textContent = `${it.source} · ${it.published_at} · 标签：${(it.tags||[]).join(',')}`;
  const chunks = splitToChunks(it.content||'暂无正文');
  const box = qs('#detailChunks');
  box.innerHTML = chunks.map((c, idx)=> `<div class="chunk"><strong>分块 ${idx+1}</strong><div>${c}</div></div>`).join('');
  qs('#detailModal').classList.remove('hidden');
}

// Search
function bindSearch(){
  qs('#btnSearch').addEventListener('click', ()=>{
    const q = qs('#searchInput').value.trim();
    const k = Number(qs('#topK').value);
    const results = mockSearch(q, k);
    renderResults(results);
  });
  qs('#btnWeb').addEventListener('click', ()=>{
    const q = qs('#searchInput').value.trim();
    if (!q) return;
    // Simulate web fallback
    showNotice('正在联网检索...');
    setTimeout(()=>{
      const web = [
        { id: 'w1', score: (0.6+Math.random()*0.3).toFixed(3), title: `联网结果：${q} 最新进展`, snippet: `${q} 的权威媒体报道摘要...`, source_url: 'https://www.baidu.com/s?wd='+encodeURIComponent(q), source_name: 'Web' }
      ];
      renderResults(web);
      showNotice('联网检索完成');
    }, 1200);
  });
}

function mockSearch(q, k){
  if (!q) return [];
  const matched = state.kb.filter(a=> a.title.includes(q) || (a.content||'').includes(q));
  if (!matched.length) return [];
  const base = matched.map(a=>({
    id: `${a.id}-0`, score: Math.random().toFixed(3), title: a.title,
    snippet: `${a.title} ... 与 "${q}" 相关片段 ...`, source_url: '#', source_name: a.source
  }));
  return base.slice(0,k);
}

function renderResults(list){
  const box = qs('#searchResults');
  if (!list.length) { box.innerHTML = '<div class="result">未命中，点击“联网搜索”尝试外部检索。</div>'; return; }
  box.innerHTML = list.map(r=>
    `<div class="result">
      <div><strong>${r.title}</strong><span class="badge">相似度 ${r.score}</span></div>
      <div class="sub">${r.snippet}</div>
      <a href="${r.source_url}" target="_blank">${r.source_name}</a>
    </div>`
  ).join('');
}

// Analytics
function bindAnalytics(){
  qs('#btnAnalytics').addEventListener('click', ()=>{
    const top = computeTopKeywords();
    const ul = qs('#topKeywords');
    ul.innerHTML = top.map(([k, v])=> `<li>${k} - ${v}</li>`).join('');
    qs('#trend').textContent = '（示意）本周趋势：▁▃▅▇▆▅▃';
  });
}

function computeTopKeywords(){
  const freq = new Map();
  state.kb.forEach(a=> (a.tags||[]).forEach(t=> freq.set(t, (freq.get(t)||0)+1)));
  return Array.from(freq.entries()).sort((a,b)=> b[1]-a[1]).slice(0,10);
}

// Settings
function bindSettings(){
  // Tabs
  qsa('.tab').forEach(t=> t.addEventListener('click', ()=>{
    qsa('.tab').forEach(x=> x.classList.remove('active'));
    qsa('.tab-content').forEach(x=> x.classList.remove('visible'));
    t.classList.add('active');
    qs(`#tab-${t.dataset.tab}`).classList.add('visible');
  }));
  // RSS
  qs('#btnAddRss').addEventListener('click', ()=>{
    const name = prompt('RSS 名称');
    const url = prompt('RSS URL');
    if (!name || !url) return;
    const id = (state.rss.at(-1)?.id||0)+1;
    state.rss.push({ id, name, url, category: '', active: true, last_fetch: '-' });
    renderRSS();
  });
  qs('#btnFetchNow').addEventListener('click', ()=>{
    showNotice('已触发抓取任务');
    setTimeout(()=>{ showNotice('抓取完成：新增 2 条'); state.stats.ingest += 2; renderDashboard(); }, 1200);
  });
  qs('#modelForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    state.models.ollamaUrl = qs('#ollamaUrl').value.trim() || state.models.ollamaUrl;
    state.models.llmModel = qs('#llmModel').value.trim() || state.models.llmModel;
    state.models.embModel = qs('#embModel').value.trim() || state.models.embModel;
    state.models.rerankModel = qs('#rerankModel').value.trim() || state.models.rerankModel;
    showNotice('模型配置已保存');
  });
}

function renderRSS(){
  const tbody = qs('#rssTable tbody');
  tbody.innerHTML = state.rss.map(r=>
    `<tr>
      <td>${r.name}</td>
      <td>${r.url}</td>
      <td>${r.category||''}</td>
      <td>${r.active? '是':'否'}</td>
      <td>${r.last_fetch}</td>
      <td><button class="small" data-rss="edit" data-id="${r.id}">编辑</button> <button class="small danger" data-rss="del" data-id="${r.id}">删除</button></td>
    </tr>`
  ).join('');
  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.rss==='del'){
      if (!confirm('确认删除该RSS？')) return;
      state.rss = state.rss.filter(x=> x.id!==id);
      renderRSS();
    }
    if (btn.dataset.rss==='edit'){
      const item = state.rss.find(x=> x.id===id);
      const name = prompt('名称', item.name); if (name===null) return;
      const url = prompt('URL', item.url); if (url===null) return;
      item.name = name; item.url = url; renderRSS();
    }
  }, { once: true });
}

function renderUsers(){
  const tbody = qs('#userTable tbody');
  tbody.innerHTML = state.users.map(u=>
    `<tr>
      <td>${u.username}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.last_login}</td>
      <td>
        <button class="small" data-user="role" data-id="${u.id}">分配角色</button>
        <button class="small danger" data-user="del" data-id="${u.id}">删除</button>
      </td>
    </tr>`
  ).join('');
  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (btn.dataset.user==='del'){
      if (!confirm('确认删除该用户？')) return;
      state.users = state.users.filter(x=> x.id!==id);
      renderUsers();
    }
    if (btn.dataset.user==='role'){
      const item = state.users.find(x=> x.id===id);
      const role = prompt('角色（user/editor/admin）', item.role);
      if (role) { item.role = role; renderUsers(); }
    }
  }, { once: true });
}

// Init
(function init(){
  seed();
  bindNav();
  bindAuth();
  bindKB();
  bindSearch();
  bindAnalytics();
  bindSettings();
  renderDashboard();
  renderKB();
  renderRSS();
  renderUsers();
})();
