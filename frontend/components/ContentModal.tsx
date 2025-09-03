'use client';
import { X, Calendar, Tag, Globe, ExternalLink, Copy, Check, Edit3, Save, XCircle } from 'lucide-react';
import { useState } from 'react';

type ContentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    title: string;
    content?: string;
    source_url?: string;
    source_name?: string;
    category?: string;
    created_at?: string;
    summary?: string | null;
  } | null;
  onSave?: (id: number, data: Partial<ContentModalProps['item']>) => Promise<void>;
  categories?: string[];
  sources?: string[];
};

export default function ContentModal({ 
  isOpen, 
  onClose, 
  item, 
  onSave,
  categories = [],
  sources = []
}: ContentModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ContentModalProps['item']>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !item) return null;

  // 调试信息
  console.log('ContentModal render:', {
    isOpen,
    item,
    isEditing,
    editForm,
    onSave: !!onSave,
    categories: categories?.length,
    sources: sources?.length
  });

  // 初始化编辑表单
  const startEdit = () => {
    setEditForm({
      title: item.title,
      content: item.content,
      source_name: item.source_name,
      category: item.category,
      summary: item.summary,
    });
    setIsEditing(true);
  };

  // 取消编辑
  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(item.id, editForm);
      setIsEditing(false);
      setEditForm({});
      // 可以在这里添加成功提示
    } catch (error) {
      console.error('保存失败:', error);
      // 可以在这里添加错误提示
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (item.content) {
      try {
        await navigator.clipboard.writeText(item.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 px-6 py-4 text-white relative overflow-hidden">
          {/* 装饰性背景元素 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-3 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="flex flex-col space-y-3 relative z-10">
            {/* 标题行 */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex space-x-1 flex-shrink-0">
                  <div className="w-2 h-2 bg-white opacity-60 rounded-full"></div>
                  <div className="w-2 h-2 bg-white opacity-40 rounded-full"></div>
                  <div className="w-2 h-2 bg-white opacity-20 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full text-lg lg:text-xl font-bold bg-white bg-opacity-20 rounded-lg px-3 py-1 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      placeholder="输入标题..."
                    />
                  ) : (
                    <h2 className="text-lg lg:text-xl font-bold drop-shadow-sm truncate max-w-[400px] lg:max-w-[500px]" title={item.title}>
                      {item.title}
                    </h2>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 flex-shrink-0 lg:ml-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="text-white hover:text-green-200 transition-all duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 hover:scale-110 disabled:opacity-50"
                      title="保存"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-white hover:text-red-200 transition-all duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 hover:scale-110"
                      title="取消"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="text-white hover:text-blue-200 transition-all duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 hover:scale-110"
                    title="编辑"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-all duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 hover:scale-110"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 元信息卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-700">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">来源</span>
              </div>
              {isEditing ? (
                <select
                  value={editForm.source_name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, source_name: e.target.value }))}
                  className="w-full mt-1 rounded border border-blue-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">选择来源</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              ) : (
                <div className="mt-1">
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-900 font-semibold hover:text-blue-700 transition-colors duration-200 group"
                      title={`点击访问 ${item.source_name || '原始网站'}`}
                    >
                      <span>{item.source_name || '未知来源'}</span>
                      <svg className="w-3 h-3 text-blue-600 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <p className="text-slate-900 font-semibold">
                      {item.source_name || '-'}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-700">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">分类</span>
              </div>
              {isEditing ? (
                <select
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full mt-1 rounded border border-green-300 px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">选择分类</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <p className="text-green-900 font-semibold mt-1">
                  {item.category || '-'}
                </p>
              )}
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-700">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">创建时间</span>
              </div>
              <p className="text-slate-900 font-semibold mt-1 text-sm">
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>

          {/* 摘要信息 */}
          {(item.summary || isEditing) && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6">
              <div className="flex items-center space-x-2 text-slate-800 mb-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span className="font-medium">摘要</span>
              </div>
              {isEditing ? (
                <textarea
                  value={editForm.summary || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full rounded border border-yellow-300 px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                  rows={3}
                  placeholder="输入摘要..."
                />
              ) : (
                <p className="text-slate-900 leading-relaxed">
                  {item.summary}
                </p>
              )}
            </div>
          )}

          {/* 主要内容 */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span>内容详情</span>
              </h3>
              {!isEditing && (
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>复制内容</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {isEditing ? (
                <textarea
                  value={editForm.content || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={12}
                  placeholder="输入内容..."
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {item.content || '暂无内容'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 内容统计信息 */}
          {item.content && !isEditing && (
            <div className="mt-6 bg-slate-100 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center space-x-4">
                  <span>字符数: {item.content.length}</span>
                  <span>单词数: {item.content.split(/\s+/).filter(Boolean).length}</span>
                  <span>行数: {item.content.split('\n').length}</span>
                </div>
                <div className="text-xs">
                  最后更新: {formatDate(item.created_at)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 弹窗底部 */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-500">
                点击外部区域或按 ESC 键关闭
              </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? '保存中...' : '保存'}</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>复制内容</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={startEdit}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <Edit3 className="w-4 h-4 inline mr-2" />
                    编辑
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm font-medium border border-slate-200 hover:border-slate-300"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
