'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Protected } from '@/components/Protected';
import { Filter, X, Search, Calendar, Tag, Globe, ChevronDown, ChevronUp, Edit3, Trash2, Save, XCircle, CheckSquare, Square, Eye } from 'lucide-react';
import ContentModal from '@/components/ContentModal';

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
  
  // 筛选状态
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // 筛选器收缩状态
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 删除确认状态
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

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
    
    setFilteredItems(filtered);
    setCurrentPage(1); // 重置到第一页
    // 重置选择状态
    setSelectedIds(new Set());
    setIsSelectAll(false);
  }, [items, categoryFilter, dateFilter, sourceFilter]);

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
  };

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = categoryFilter || dateFilter || sourceFilter;

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
      // 这里应该调用后端API删除数据
      // await api.delete(`/api/kb/items/${id}`);
      
      // 临时更新本地状态（实际项目中应该等待API响应）
      setItems(prev => prev.filter(item => item.id !== id));
      setDeleteId(null);
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
      // 这里应该调用后端API批量删除数据
      // await api.post('/api/kb/items/batch-delete', { ids: Array.from(selectedIds) });
      
      // 临时更新本地状态（实际项目中应该等待API响应）
      setItems(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      setIsSelectAll(false);
      setShowBatchDeleteConfirm(false);
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
          <h1 className="text-3xl font-bold text-gray-900">知识库</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>智能筛选与分页</span>
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

                {/* 操作按钮 */}
                <div className="flex items-end space-x-3">
                  <button
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>清除筛选</span>
                  </button>
                </div>
              </div>
              
              {/* 筛选结果统计 */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>筛选结果：</span>
                    <span className="font-semibold text-gray-800">{filteredItems.length}</span>
                    <span>条记录</span>
                  </div>
                  
                  {hasActiveFilters && (
                    <div className="flex items-center space-x-2 text-xs">
                      {categoryFilter && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          分类: {categoryFilter}
                        </span>
                      )}
                      {sourceFilter && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          来源: {sourceFilter}
                        </span>
                      )}
                      {dateFilter && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          日期: {dateFilter}
                        </span>
                      )}
                    </div>
                  )}
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
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200"
                            >
                              <Eye className="w-3 h-3" />
                              <span>查看</span>
                            </button>
                            <button
                              onClick={() => setDeleteId(it.id)}
                              className="inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>删除</span>
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
      </main>
    </Protected>
  );
}

