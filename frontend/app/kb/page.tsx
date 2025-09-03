'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { Filter, X, Search, Calendar, Tag, Globe, ChevronDown, ChevronUp, Edit3, Trash2, Save, XCircle, CheckSquare, Square, Eye } from 'lucide-react';
import ContentModal from '@/components/ContentModal';
import * as XLSX from 'xlsx';

type KbItem = {
  id: number;
  title: string;
  content?: string;
  source_url?: string;
  source_name?: string;
  category?: string;
  created_at?: string;
  summary?: string | null;
};

export default function KbListPage() {
  const [items, setItems] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredItems, setFilteredItems] = useState<KbItem[]>([]);
  // 仪表盘汇总中的“知识库最近更新”(后端已综合手动/自动采集时间)
  const [latestUpdateISO, setLatestUpdateISO] = useState<string | null>(null);
  
  // 筛选状态
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [jumpPage, setJumpPage] = useState<string>('');

  // 筛选器收缩状态
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 删除确认状态
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // 导出为 Excel（导出当前筛选结果）
  const exportToExcel = () => {
    try {
      const data = filteredItems.map((it) => ({
        标题: it.title,
        内容: it.content || '',
        来源名称: it.source_name || '',
        来源链接: it.source_url || '',
        分类: it.category || '',
        创建时间: it.created_at || '',
        摘要: it.summary || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '知识库');
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      XLSX.writeFile(wb, `知识库导出_${ts}.xlsx`);
    } catch (err) {
      console.error('导出失败', err);
      alert('导出失败，请重试');
    }
  };

  // 导入弹窗状态
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // 模板生成（与导出字段一致）
  const downloadTemplate = () => {
    const headers = [{
      标题: '必填',
      内容: '必填',
      来源名称: '',
      来源链接: '',
      分类: '',
      创建时间: '可留空，系统会自动填入',
      摘要: ''
    }];
    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '模板');
    XLSX.writeFile(wb, '知识库导入模板.xlsx');
  };

  // 解析与上传
  const handleImportFile = async (file: File) => {
    setImportErrors([]);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
      // 支持两种表头：中文表头 或 后端字段名
      const norm = rows.map((r, idx) => {
        const title = r['标题'] ?? r['title'] ?? '';
        const content = r['内容'] ?? r['content'] ?? '';
        const source_name = r['来源名称'] ?? r['source_name'] ?? '';
        const source_url = r['来源链接'] ?? r['source_url'] ?? '';
        const category = r['分类'] ?? r['category'] ?? '';
        const published_at = r['发布时间'] ?? r['published_at'] ?? '';
        return { title, content, source_name, source_url, category, published_at, __row: idx + 2 };
      });
      // 基本校验：title/content 必填
      const errs: string[] = [];
      const validItems = norm.filter((it) => {
        const ok = String(it.title).trim() && String(it.content).trim();
        if (!ok) errs.push(`第 ${it.__row} 行: 标题或内容为空`);
        return ok;
      }).map(({ __row, ...rest }) => rest);

      if (errs.length) {
        setImportErrors(errs);
        return;
      }

      setImporting(true);
      const resp = await api.post('/api/kb/items/import', { items: validItems });
      const d = resp.data?.data || {};
      // 成功后刷新列表
      const res = await api.get('/api/kb/items');
      const dataItems = res.data?.data || res.data || [];
      setItems(dataItems);
      setFilteredItems(dataItems);
      alert(`导入完成：新增 ${d.inserted || 0} 条，跳过 ${d.skipped || 0} 条`);
      setImportOpen(false);
    } catch (e: any) {
      console.error('导入失败', e);
      setImportErrors([e?.message || '导入失败']);
    } finally {
      setImporting(false);
    }
  };

  // 内容弹窗状态
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KbItem | null>(null);

  useEffect(() => {
    api
      .get('/api/kb/items')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setItems(data);
        setFilteredItems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // 获取“知识库最近更新”时间（后端已取手动与自动采集的较新者）
  useEffect(() => {
    api
      .get('/api/dashboard/summary', { params: { t: Date.now() } })
      .then((res) => {
        const d = res.data?.data || res.data || {};
        setLatestUpdateISO(d.latest_update || null);
      })
      .catch(() => {})
  }, []);

  // 应用筛选
  useEffect(() => {
    let filtered = [...items];
    
    // 按分类筛选
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // 按来源筛选
    if (sourceFilter) {
      filtered = filtered.filter(item => item.source_name === sourceFilter);
    }
    
    // 按时间筛选
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(item => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate.toDateString() === filterDate.toDateString();
      });
    }
    
    // 关键词搜索（标题/内容）
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      filtered = filtered.filter(item => {
        const t = (item.title || '').toLowerCase();
        const c = (item.content || '').toLowerCase();
        return t.includes(q) || c.includes(q);
      });
    }
    
    // 排序
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        const av = (a.title || '').localeCompare(b.title || '');
        return sortOrder === 'asc' ? av : -av;
      } else {
        const at = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'asc' ? (at - bt) : (bt - at);
      }
    });
    
    setFilteredItems(filtered);
    setCurrentPage(1); // 重置到第一页
    // 重置选择状态
    setSelectedIds(new Set());
    setIsSelectAll(false);
  }, [items, categoryFilter, dateFilter, sourceFilter, keyword, sortBy, sortOrder]);

  // 获取唯一的分类和来源列表
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  const sources = [...new Set(items.map(item => item.source_name).filter(Boolean))];

  // 分页计算
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // 清除筛选
  const clearFilters = () => {
    setCategoryFilter('');
    setDateFilter('');
    setSourceFilter('');
    setKeyword('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = categoryFilter || dateFilter || sourceFilter || keyword;

  // 切换筛选器展开状态
  const toggleFilterExpanded = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  // 打开内容弹窗
  const openContentModal = (item: KbItem) => {
    setSelectedItem(item);
    setContentModalOpen(true);
  };

  // 关闭内容弹窗
  const closeContentModal = () => {
    setContentModalOpen(false);
    setSelectedItem(null);
  };

  // 保存编辑内容
  const handleSaveContent = async (id: number, data: Partial<KbItem>) => {
    try {
      // 这里应该调用后端API更新数据
      // await api.put(`/api/kb/items/${id}`, data);
      
      // 临时更新本地状态（实际项目中应该等待API响应）
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, ...data, updated_at: new Date().toISOString() }
          : item
      ));
      
      // 更新筛选后的列表
      setFilteredItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, ...data, updated_at: new Date().toISOString() }
          : item
      ));
      
      return Promise.resolve();
    } catch (error) {
      console.error('更新失败:', error);
      return Promise.reject(error);
    }
  };

  // 删除条目
  const deleteItem = async (id: number) => {
    try {
      // 调用后端API删除数据
      const resp = await api.delete(`/api/kb/items/${id}`);
      const newTotal = resp.data?.data?.total as number | undefined;
      
      // 临时更新本地状态（实际项目中应该等待API响应）
      setItems(prev => prev.filter(item => item.id !== id));
      setDeleteId(null);
      // 通知仪表盘刷新（带最新总数，尽量避免短暂不同步）
      if (typeof window !== 'undefined') {
        const evt = new CustomEvent('kb:changed', { detail: { total: typeof newTotal === 'number' ? newTotal : undefined } });
        window.dispatchEvent(evt);
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 批量选择相关函数
  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedIds(new Set());
      setIsSelectAll(false);
    } else {
      const allIds = new Set(currentItems.map(item => item.id));
      setSelectedIds(allIds);
      setIsSelectAll(true);
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
    
    // 检查是否全选
    const allIds = new Set(currentItems.map(item => item.id));
    setIsSelectAll(newSelectedIds.size === allIds.size);
  };

  const isItemSelected = (id: number) => selectedIds.has(id);

  // 批量删除
  const batchDelete = async () => {
    try {
      // 调用后端API批量删除数据
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;
      const resp = await api.post('/api/kb/items/batch-delete', { ids });
      const newTotal = resp.data?.data?.total as number | undefined;
      
      // 临时更新本地状态（实际项目中应该等待API响应）
      setItems(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      setIsSelectAll(false);
      setShowBatchDeleteConfirm(false);
      // 通知仪表盘刷新（带最新总数）
      if (typeof window !== 'undefined') {
        const evt = new CustomEvent('kb:changed', { detail: { total: typeof newTotal === 'number' ? newTotal : undefined } });
        window.dispatchEvent(evt);
      }
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除失败，请重试');
    }
  };

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && contentModalOpen) {
        closeContentModal();
      }
    };

    if (contentModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 禁用页面滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 恢复页面滚动
      document.body.style.overflow = 'unset';
    };
  }, [contentModalOpen]);

  return (
    <Protected>
      <main className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">知识库</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                最近更新: {(() => {
                  if (!latestUpdateISO) return '暂无数据';
                  const dt = new Date(latestUpdateISO);
                  if (isNaN(dt.getTime())) return '暂无数据';
                  return dt.toLocaleString('zh-CN', {
                    timeZone: 'Asia/Shanghai',
                    hour12: false,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).replace(/-/g, '/');
                })()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              title="导出当前筛选结果为 Excel"
            >
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 3h-13A1.5 1.5 0 002 4.5v11A1.5 1.5 0 003.5 17h13a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0016.5 3zm-7.9 9.7L6.6 10l2-2.7a.75.75 0 10-1.2-.9L5.5 8.8 3.8 6.4a.75.75 0 10-1.2.9L4.3 10l-1.7 2.7a.75.75 0 101.2.9l1.7-2.4 1.7 2.4a.75.75 0 101.2-.9zM17 15H9a1 1 0 110-2h8a1 1 0 110 2z"/></svg>
              <span>导出 Excel</span>
            </button>
            <button
              onClick={() => { setImportErrors([]); setImportOpen(true); }}
              className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              title="从 Excel 导入"
            >
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3a2 2 0 00-2 2v3a1 1 0 102 0V5h12v10H3v-3a1 1 0 10-2 0v3a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H3z"></path><path d="M7 9a1 1 0 011-1h2V6a1 1 0 112 0v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H8a1 1 0 01-1-1z"></path></svg>
              <span>导入 Excel</span>
            </button>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>智能筛选与分页</span>
            </div>
          </div>
        </div>
        
        {/* 筛选器 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* 筛选器头部 - 始终可见 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <button
              onClick={toggleFilterExpanded}
              className="flex items-center justify-between w-full text-left hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors duration-200"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">筛选条件</h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    已启用
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {hasActiveFilters && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilters();
                    }}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                  >
                    <X className="w-3 h-3" />
                    <span>清除</span>
                  </button>
                )}
                {isFilterExpanded ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </button>
          </div>
          
          {/* 筛选器内容 - 可收缩 */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-6 space-y-6">
              {/* 筛选器网格 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 分类筛选 */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span>分类</span>
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">全部分类</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 来源筛选 */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>来源</span>
                  </label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">全部来源</option>
                    {sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                {/* 时间筛选 */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>创建日期</span>
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                {/* 关键词搜索 */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>关键词</span>
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索标题或内容"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  />
                </div>
              </div>
              
              {/* 排序与每页数量 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">排序字段</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="created_at">时间</option>
                    <option value="title">标题</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">排序方式</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">降序</option>
                    <option value="asc">升序</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">每页数量</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value) || 20)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 批量操作工具栏 */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-blue-800">
                  已选择 <span className="font-semibold">{selectedIds.size}</span> 项
                </span>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  清除选择
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>批量删除</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载中...</span>
          </div>
        ) : (
          <>
            {/* 数据表格 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center space-x-2 hover:bg-gray-200 rounded p-1 transition-colors duration-200"
                        >
                          {isSelectAll ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                          <span>全选</span>
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">标题</th>
                      <th className="text-left p-4 font-semibold text-gray-700">内容</th>
                      <th className="text-left p-4 font-semibold text-gray-700">来源</th>
                      <th className="text-left p-4 font-semibold text-gray-700">分类</th>
                      <th className="text-left p-4 font-semibold text-gray-700">时间</th>
                      <th className="text-left p-4 font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((it) => (
                      <tr key={it.id} className={`hover:bg-gray-50 transition-colors duration-150 ${
                        isItemSelected(it.id) ? 'bg-blue-50' : ''
                      }`}>
                        {/* 选择列 */}
                        <td className="p-4">
                          <button
                            onClick={() => toggleSelectItem(it.id)}
                            className="flex items-center space-x-2 hover:bg-gray-200 rounded p-1 transition-colors duration-200"
                          >
                            {isItemSelected(it.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>

                        {/* 标题列 */}
                        <td className="p-4">
                          <span className="font-medium text-gray-900">{it.title}</span>
                        </td>

                        {/* 内容列 */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openContentModal(it)}
                              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
                              title="点击查看完整内容"
                            >
                              <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                              <span className="max-w-[400px] truncate block">
                                {it.content || '-'}
                              </span>
                            </button>
                          </div>
                        </td>

                        {/* 来源列 */}
                        <td className="p-4">
                          {it.source_url ? (
                            <a
                              href={it.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-900 transition-all duration-200 cursor-pointer group"
                              title={`点击访问 ${it.source_name || '原始网站'}`}
                            >
                              <span>{it.source_name || '未知来源'}</span>
                              <svg className="w-3 h-3 text-purple-600 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {it.source_name || '-'}
                            </span>
                          )}
                        </td>

                        {/* 分类列 */}
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {it.category || '-'}
                          </span>
                        </td>

                        {/* 时间列 */}
                        <td className="p-4 text-gray-500">
                          {it.created_at ? new Date(it.created_at).toLocaleDateString('zh-CN') : '-'}
                        </td>

                        {/* 操作列 */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openContentModal(it)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 shadow-sm hover:shadow transition-all duration-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="tracking-wide">查看</span>
                            </button>
                            <button
                              onClick={() => setDeleteId(it.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-rose-50 to-red-50 text-red-700 border border-red-200 hover:from-rose-100 hover:to-red-100 hover:border-red-300 shadow-sm hover:shadow transition-all duration-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="tracking-wide">删除</span>
                            </button>
                          </div>
                        </td>
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    第 <span className="font-semibold text-gray-900">{startIndex + 1}</span>-<span className="font-semibold text-gray-900">{Math.min(endIndex, filteredItems.length)}</span> 条，
                    共 <span className="font-semibold text-gray-900">{filteredItems.length}</span> 条
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                    >首页</button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                    >
                      上一页
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                            currentPage === page 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
                    >
                      下一页
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                    >末页</button>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-sm text-gray-600">跳至</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={jumpPage}
                        onChange={(e) => setJumpPage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const v = Math.max(1, Math.min(totalPages, parseInt(jumpPage || '0') || 1));
                            setCurrentPage(v);
                            setJumpPage('');
                          }
                        }}
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-sm text-gray-600">/ {totalPages}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 删除确认对话框 */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除这条知识库条目吗？此操作不可撤销。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteItem(deleteId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 批量删除确认对话框 */}
        {showBatchDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">确认批量删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除选中的 <span className="font-semibold text-red-600">{selectedIds.size}</span> 条知识库条目吗？此操作不可撤销。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBatchDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  取消
                </button>
                <button
                  onClick={batchDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                >
                  批量删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 内容弹窗 */}
        {selectedItem && (
          <ContentModal
            isOpen={contentModalOpen}
            onClose={closeContentModal}
            item={selectedItem}
            onSave={handleSaveContent}
            categories={categories}
            sources={sources}
          />
        )}

        {/* 导入弹窗 */}
        {importOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">导入 Excel 到知识库</h3>
                <button onClick={() => setImportOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="font-medium mb-2">格式要求：</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>必填列：标题、内容</li>
                    <li>可选列：来源名称、来源链接、分类、发布时间</li>
                    <li>发布时间格式建议：ISO 8601（例如 2025-09-03T08:00:00Z）</li>
                    <li>若提供来源链接，与现有记录链接重复将跳过</li>
                  </ul>
                  <button onClick={downloadTemplate} className="mt-3 inline-flex items-center px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-100">下载模板</button>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportFile(f);
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {importing && <div className="text-blue-600">正在导入，请稍候...</div>}
                {importErrors.length > 0 && (
                  <div className="text-red-600 space-y-1">
                    {importErrors.map((m, i) => (
                      <div key={i}>• {m}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setImportOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">关闭</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </Protected>
  );
}

