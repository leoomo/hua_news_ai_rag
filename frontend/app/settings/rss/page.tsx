'use client';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { isNonEmpty, isUrl } from '@/lib/validators';
import { useNotification, NotificationContainer } from '@/components/Notification';
import { IngestProgress } from '@/components/IngestProgress';

type Rss = { id: number; name: string; url: string; category?: string; is_active?: boolean; last_fetch?: string | null };
type RssStatus = { id: number; source_id: number; url: string; status: string; created: number; skipped: number; error_message?: string; created_at?: string };

export default function RssSettingsPage() {
  const [items, setItems] = useState<Rss[]>([]);
  const [form, setForm] = useState<Partial<Rss>>({ name: '', url: '', category: '', is_active: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<number, RssStatus | undefined>>({});
  const [autoOn, setAutoOn] = useState<boolean>(false);
  const [nextRun, setNextRun] = useState<string | null>(null);
  // 新增：采集状态管理
  const [ingestingIds, setIngestingIds] = useState<Set<number>>(new Set());
  const [isIngestingAll, setIsIngestingAll] = useState<boolean>(false);
  
  // 进度指示器状态
  const [showProgress, setShowProgress] = useState(false);
  const [progressType, setProgressType] = useState<'single' | 'batch'>('single');
  const [progressSourceName, setProgressSourceName] = useState<string>('');
  // 新增：进度弹窗状态管理
  const [progressStatus, setProgressStatus] = useState<'running' | 'success' | 'error'>('running');
  // 单条采集：每条源的进度（0-100）
  const [singleProgress, setSingleProgress] = useState<Record<number, number>>({});
  const singleTimers = useRef<Record<number, any>>({});
  const [justCompletedIds, setJustCompletedIds] = useState<Set<number>>(new Set());
  // 批量采集：整体进度（0-100）
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const batchTimer = useRef<any>(null);
  const [batchJustCompleted, setBatchJustCompleted] = useState<boolean>(false);
  
  // 使用通知管理器
  const notification = useNotification();

  useEffect(() => {
    api.get('/api/settings/rss').then((res) => setItems(res.data?.data || res.data || []));
    api.get('/api/settings/rss/status').then((res) => {
      const arr: RssStatus[] = res.data?.data || [];
      const map: Record<number, RssStatus> = {};
      for (const r of arr) if (r.source_id) map[r.source_id] = r;
      setStatus(map);
    });
    api.get('/api/scheduler/status').then((res) => {
      const data = res.data?.data || {};
      setAutoOn(!!data.enabled);
      const jr = (data.jobs && data.jobs[0]?.next_run_time) || null;
      setNextRun(jr);
    }).catch(() => {});
  }, []);

  async function refresh() {
    const res = await api.get('/api/settings/rss');
    setItems(res.data?.data || res.data || []);
    const s = await api.get('/api/settings/rss/status');
    const arr: RssStatus[] = s.data?.data || [];
    const map: Record<number, RssStatus> = {};
    for (const r of arr) if (r.source_id) map[r.source_id] = r;
    setStatus(map);
  }

  async function onToggleAuto(e: React.ChangeEvent<HTMLInputElement>) {
    const turnOn = e.target.checked;
    setAutoOn(turnOn);
    try {
      if (turnOn) {
        await api.post('/api/scheduler/start');
      } else {
        await api.post('/api/scheduler/stop');
      }
      const res = await api.get('/api/scheduler/status');
      const data = res.data?.data || {};
      setAutoOn(!!data.enabled);
      const jr = (data.jobs && data.jobs[0]?.next_run_time) || null;
      setNextRun(jr);
      
      if (turnOn) {
        notification.showSuccess('调度器启动成功', 'RSS自动采集已开启');
      } else {
        notification.showInfo('调度器已停止', 'RSS自动采集已关闭');
      }
    } catch (err) {
      notification.showError('调度器操作失败', '无法启动或停止RSS自动采集');
    }
  }

  async function onCreate() {
    setError(null);
    if (!isNonEmpty(form.name || '')) return setError('请输入名称');
    if (!isUrl(form.url || '')) return setError('请输入合法 URL');
    
    try {
      await api.post('/api/settings/rss', form);
      notification.showSuccess('RSS源添加成功', `${form.name} 已添加到RSS源列表`);
      setForm({ name: '', url: '', category: '', is_active: true });
      refresh();
    } catch (error: any) {
      let errorMessage = '添加RSS源失败';
      if (error.response?.data?.msg) {
        errorMessage += `: ${error.response.data.msg}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      notification.showError('添加失败', errorMessage);
    }
  }

  async function onIngest(id: number) {
    // 防止重复点击
    if (ingestingIds.has(id)) return;
    // 互斥：批量采集中则禁止单个采集
    if (isIngestingAll) return;
    
    const sourceName = items.find(item => item.id === id)?.name || 'RSS源';
    
    // 先重置进度指示器状态（仅用于弹窗；单条改为按钮内展示进度）
    setShowProgress(false);
    setProgressType('single');
    setProgressSourceName(sourceName);
    setProgressStatus('running');
    
    // 启动该条目的按钮内进度（模拟推进至90%）
    setSingleProgress(prev => ({ ...prev, [id]: 0 }));
    const timer = setInterval(() => {
      setSingleProgress(prev => {
        const cur = prev[id] ?? 0;
        const next = Math.min(90, cur + Math.floor(5 + Math.random() * 10));
        return { ...prev, [id]: next };
      });
    }, 300);
    singleTimers.current[id] = timer;

    setIngestingIds(prev => new Set(prev).add(id));
    try {
      const response = await api.post(`/api/settings/rss/ingest?id=${id}`);
      
      // 设置成功状态
      setProgressStatus('success');
      // 将该条目进度补到100%
      setSingleProgress(prev => ({ ...prev, [id]: 100 }));
      // 触发短暂完成动效
      setJustCompletedIds(prev => new Set(prev).add(id));
      setTimeout(() => {
        setJustCompletedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 500);
      
      // 成功提示
      setTimeout(() => {
        notification.showSuccess('采集成功', `已触发RSS源"${sourceName}"的采集任务`);
      }, 200);
      
      refresh();
      
      // 注意：弹窗不用于单条；此处仅按钮内进度展示
    } catch (error: any) {
      // 错误状态
      setProgressStatus('error');
      setSingleProgress(prev => ({ ...prev, [id]: 100 }));
      // 显示具体的错误原因
      let errorMessage = '采集失败';
      if (error.response?.data?.msg) {
        errorMessage += `: ${error.response.data.msg}`;
      } else if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage += ': 网络连接失败，请检查后端服务是否正常运行';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += ': 请求超时，请稍后重试';
      } else {
        errorMessage += ': 未知错误，请稍后重试';
      }
      notification.showError('采集失败', errorMessage);
    } finally {
      // 清理该条目的进度计时器与禁用状态，与按钮恢复同步
      setTimeout(() => {
        if (singleTimers.current[id]) {
          clearInterval(singleTimers.current[id]);
          delete singleTimers.current[id];
        }
        setIngestingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        // 单条完成后，短暂保留100%展示，再移除进度
        setTimeout(() => {
          setSingleProgress(prev => {
            const { [id]: _omit, ...rest } = prev;
            return rest;
          });
        }, 600);
      }, 1500);
    }
  }

  async function onIngestAll() {
    // 防止重复点击
    if (isIngestingAll) return;
    // 互斥：存在任意单个采集中则禁止批量采集
    if (ingestingIds.size > 0) return;
    
    // 不再使用弹窗显示批量进度（按钮内展示）
    setProgressType('batch');
    setProgressStatus('running');
    
    // 启动批量按钮内进度
    setBatchProgress(0);
    if (batchTimer.current) {
      clearInterval(batchTimer.current);
      batchTimer.current = null;
    }
    batchTimer.current = setInterval(() => {
      setBatchProgress(prev => Math.min(90, prev + Math.floor(5 + Math.random() * 10)));
    }, 300);

    setIsIngestingAll(true);
    try {
      const response = await api.post('/api/settings/rss/ingest_all');
      
      // 设置成功状态
      setProgressStatus('success');
      // 批量进度补到100%
      setBatchProgress(100);
      setBatchJustCompleted(true);
      setTimeout(() => setBatchJustCompleted(false), 500);
      
      // 延迟显示成功通知
      setTimeout(() => {
        notification.showSuccess('批量采集成功', '已触发所有RSS源的批量采集任务');
      }, 200);
      
      refresh();
      
    } catch (error: any) {
      // 设置错误状态
      setProgressStatus('error');
      setBatchProgress(100);
      // 显示具体的错误原因
      let errorMessage = '批量采集失败';
      if (error.response?.data?.msg) {
        errorMessage += `: ${error.response.data.msg}`;
      } else if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage += ': 网络连接失败，请检查后端服务是否正常运行';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += ': 请求超时，请稍后重试';
      } else {
        errorMessage += ': 未知错误，请稍后重试';
      }
      notification.showError('批量采集失败', errorMessage);
    } finally {
      // 结束批量标记；
      setIsIngestingAll(false);
      if (batchTimer.current) {
        clearInterval(batchTimer.current);
        batchTimer.current = null;
      }
      // 完成后短暂保留100%再清零
      setTimeout(() => setBatchProgress(0), 600);
    }
  }

  const handleProgressComplete = () => {
    setShowProgress(false);
    setProgressStatus('running');
  };

  function onEditStart(item: Rss) {
    setEditingId(item.id);
    setForm(item);
  }

  async function onSaveEdit() {
    setError(null);
    if (!isNonEmpty(form.name || '')) return setError('请输入名称');
    if (!isUrl(form.url || '')) return setError('请输入合法 URL');
    
    try {
      await api.patch('/api/settings/rss', form);
      notification.showSuccess('编辑成功', `RSS源 ${form.name} 已更新`);
      setEditingId(null);
      setForm({ name: '', url: '', category: '', is_active: true });
      refresh();
    } catch (error: any) {
      let errorMessage = '编辑RSS源失败';
      if (error.response?.data?.msg) {
        errorMessage += `: ${error.response.data.msg}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      notification.showError('编辑失败', errorMessage);
    }
  }

  async function onDelete(id: number) {
    try {
      await api.delete(`/api/settings/rss?id=${id}`);
      notification.showSuccess('删除成功', 'RSS源已从列表中移除');
      refresh();
    } catch (error: any) {
      let errorMessage = '删除RSS源失败';
      if (error.response?.data?.msg) {
        errorMessage += `: ${error.response.data.msg}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      notification.showError('删除失败', errorMessage);
    }
  }
  // 当批量状态结束且没有单个采集时，自动关闭进度弹窗，保持与按钮状态同步
  useEffect(() => {
    if (!isIngestingAll && ingestingIds.size === 0) {
      setShowProgress(false);
      setProgressStatus('running');
    }
  }, [isIngestingAll, ingestingIds]);
  return (
    <main className="space-y-4">
      {/* 通知容器 */}
      <NotificationContainer notifications={notification.notifications} />
      
      {/* 进度指示器（仅用于单条模式） */}
      <IngestProgress
        key={`${showProgress}-${progressType}-${progressSourceName}`}
        isVisible={showProgress && progressType === 'single'}
        type={progressType}
        sourceName={progressSourceName}
        onComplete={handleProgressComplete}
        externalStatus={progressStatus}
        onStatusChange={setProgressStatus}
      />
      
      <h1 className="text-2xl font-semibold">RSS 源管理</h1>
      <div className="rounded border bg-white p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">自动采集</label>
          <input type="checkbox" checked={autoOn} onChange={onToggleAuto} />
        </div>
        <div className="text-sm text-gray-600">{nextRun ? `下次运行：${new Date(nextRun).toLocaleString()}` : '下次运行：-'}
        </div>
      </div>
      <div className="rounded border bg-white p-4 space-y-3">
        <h2 className="font-medium">新增</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="rounded border px-3 py-2" placeholder="名称" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded border px-3 py-2" placeholder="URL" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <input className="rounded border px-3 py-2" placeholder="分类" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="flex items-center gap-2">
            <label className="text-sm">启用</label>
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <button onClick={onCreate} className="ml-auto rounded bg-black text-white px-4 py-2">添加</button>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white">
        <div className="flex items-center justify-between p-2">
          <h2 className="font-medium">列表</h2>
          <button 
            onClick={onIngestAll} 
            disabled={isIngestingAll || ingestingIds.size > 0}
            className={`relative overflow-hidden rounded px-3 py-1 ${
              (isIngestingAll)
                ? `bg-blue-500 text-white border border-blue-500 cursor-wait ${batchJustCompleted ? 'animate-bounce' : 'animate-pulse'}` 
                : (ingestingIds.size > 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isIngestingAll ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {`批量采集 ${Math.max(0, batchProgress)}%`}
              </span>
            ) : '批量采集'}
            {isIngestingAll && (
              <span
                className="absolute bottom-0 left-0 h-0.5 bg-blue-300"
                style={{ width: `${Math.max(5, batchProgress)}%` }}
              />
            )}
          </button>
        </div>
        
        {/* 状态说明 */}
        {(isIngestingAll || ingestingIds.size > 0) && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              {isIngestingAll ? '批量采集中，所有RSS源暂时无法编辑/删除' : '部分RSS源采集中，相关条目暂时无法编辑/删除'}
            </div>
          </div>
        )}
        
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">名称</th>
              <th className="text-left p-2">URL</th>
              <th className="text-left p-2">分类</th>
              <th className="text-left p-2">启用</th>
              <th className="text-left p-2">状态</th>
              <th className="text-left p-2">最近更新时间</th>
              <th className="text-left p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className={`border-t ${
                ingestingIds.has(r.id) || isIngestingAll 
                  ? 'bg-blue-50 border-blue-200' 
                  : ''
              }`}>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input className="w-full rounded border px-2 py-1" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  ) : (
                    r.name
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input className="w-full rounded border px-2 py-1" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                  ) : (
                    r.url
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input className="w-full rounded border px-2 py-1" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  ) : (
                    r.category || '-'
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  ) : (
                    r.is_active ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200" title="启用">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200" title="停用">
                        <XCircle className="w-4 h-4" />
                      </span>
                    )
                  )}
                </td>
                <td className="p-2 text-sm">
                  {(() => {
                    const s = status[r.id];
                    if (!s) return <span className="text-gray-400">-</span>;
                    const ok = s.status === 'success';
                    const badgeBase = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
                    const badgeCls = ok
                      ? `${badgeBase} bg-green-100 text-green-700 border border-green-200`
                      : `${badgeBase} bg-red-100 text-red-700 border border-red-200`;
                    return (
                      <div className="flex items-center gap-2">
                        <span className={badgeCls} title={s.error_message || ''}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
                          {ok ? '成功' : '失败'}
                        </span>
                        {ok && (
                          <div className="flex items-center gap-1" title="本次采集统计：新增/跳过">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              新增 {s.created}
                            </span>
                            {typeof s.skipped === 'number' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                跳过 {s.skipped}
                              </span>
                            )}
                          </div>
                        )}
                        {/* 按需求：状态列不再显示时间 */}
                      </div>
                    );
                  })()}
                </td>
                <td className="p-2 text-gray-600">
                  {r.last_fetch ? (
                    new Date(r.last_fetch).toLocaleString('zh-CN', {
                      timeZone: 'Asia/Shanghai',
                      hour12: false,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(/-/g, '/')
                  ) : ''}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={onSaveEdit} 
                        disabled={ingestingIds.has(r.id) || isIngestingAll}
                        className={`rounded px-3 py-1 ${
                          (ingestingIds.has(r.id) || isIngestingAll)
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                        title={ingestingIds.has(r.id) ? '采集中，无法保存' : isIngestingAll ? '批量采集中，无法保存' : '保存修改'}
                      >
                        保存
                      </button>
                      <button 
                        onClick={() => { setEditingId(null); setForm({ name: '', url: '', category: '', is_active: true }); }} 
                        disabled={ingestingIds.has(r.id) || isIngestingAll}
                        className={`rounded border px-3 py-1 ${
                          (ingestingIds.has(r.id) || isIngestingAll)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : 'hover:bg-gray-50'
                        }`}
                        title={ingestingIds.has(r.id) ? '采集中，无法取消' : isIngestingAll ? '批量采集中，无法取消' : '取消编辑'}
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onEditStart(r)} 
                        disabled={ingestingIds.has(r.id) || isIngestingAll}
                        className={`rounded border px-3 py-1 ${
                          (ingestingIds.has(r.id) || isIngestingAll)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : 'hover:bg-gray-50'
                        }`}
                        title={ingestingIds.has(r.id) ? '采集中，无法编辑' : isIngestingAll ? '批量采集中，无法编辑' : '编辑RSS源'}
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => onDelete(r.id)} 
                        disabled={ingestingIds.has(r.id) || isIngestingAll}
                        className={`rounded border px-3 py-1 ${
                          (ingestingIds.has(r.id) || isIngestingAll)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={ingestingIds.has(r.id) ? '采集中，无法删除' : isIngestingAll ? '批量采集中，无法删除' : '删除RSS源'}
                      >
                        删除
                      </button>
                      <button 
                        onClick={() => onIngest(r.id)} 
                        disabled={ingestingIds.has(r.id) || isIngestingAll || !r.is_active}
                        className={`relative overflow-hidden rounded border px-3 py-1 ${
                          ingestingIds.has(r.id)
                            ? `bg-blue-500 text-white border-blue-500 cursor-wait ${justCompletedIds.has(r.id) ? 'animate-bounce' : 'animate-pulse'}`
                            : (isIngestingAll || !r.is_active)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'text-green-700 hover:bg-green-50'
                        }`}
                        title={!r.is_active ? '该源已停用，无法采集' : ingestingIds.has(r.id) ? '采集中...' : isIngestingAll ? '批量采集中，无法单个采集' : '手动采集RSS源'}
                      >
                        {ingestingIds.has(r.id)
                          ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {typeof singleProgress[r.id] === 'number'
                                  ? `采集 ${singleProgress[r.id]}%`
                                  : '采集中...'}
                              </span>
                            )
                          : '采集'}
                        {ingestingIds.has(r.id) && typeof singleProgress[r.id] === 'number' && (
                          <span
                            className="absolute bottom-0 left-0 h-0.5 bg-blue-300"
                            style={{ width: `${Math.max(5, singleProgress[r.id])}%` }}
                          />
                        )}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

