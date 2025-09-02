'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isNonEmpty, isUrl } from '@/lib/validators';
import { useNotification, NotificationContainer } from '@/components/Notification';
import { IngestProgress } from '@/components/IngestProgress';

type Rss = { id: number; name: string; url: string; category?: string; is_active?: boolean };
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
    
    // 先重置进度指示器状态
    setShowProgress(false);
    setProgressType('single');
    setProgressSourceName(sourceName);
    
    // 使用setTimeout确保状态重置完成后再显示
    setTimeout(() => {
      setShowProgress(true);
    }, 100);
    
    setIngestingIds(prev => new Set(prev).add(id));
    try {
      const response = await api.post(`/api/settings/rss/ingest?id=${id}`);
      // 延迟显示成功通知，让进度条先完成
      setTimeout(() => {
        notification.showSuccess('采集成功', `已触发RSS源"${sourceName}"的采集任务`);
      }, 2000);
      refresh();
    } catch (error: any) {
      setShowProgress(false);
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
      setIngestingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }

  async function onIngestAll() {
    // 防止重复点击
    if (isIngestingAll) return;
    // 互斥：存在任意单个采集中则禁止批量采集
    if (ingestingIds.size > 0) return;
    
    // 先重置进度指示器状态
    setShowProgress(false);
    setProgressType('batch');
    
    // 使用setTimeout确保状态重置完成后再显示
    setTimeout(() => {
      setShowProgress(true);
    }, 100);
    
    setIsIngestingAll(true);
    try {
      const response = await api.post('/api/settings/rss/ingest_all');
      // 延迟显示成功通知，让进度条先完成
      setTimeout(() => {
        notification.showSuccess('批量采集成功', '已触发所有RSS源的批量采集任务');
      }, 2000);
      refresh();
    } catch (error: any) {
      setShowProgress(false);
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
      setIsIngestingAll(false);
    }
  }

  const handleProgressComplete = () => {
    setShowProgress(false);
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
  return (
    <main className="space-y-4">
      {/* 通知容器 */}
      <NotificationContainer notifications={notification.notifications} />
      
      {/* 进度指示器 */}
      <IngestProgress
        key={`${showProgress}-${progressType}-${progressSourceName}`}
        isVisible={showProgress}
        type={progressType}
        sourceName={progressSourceName}
        onComplete={handleProgressComplete}
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
            className={`rounded px-3 py-1 ${
              (isIngestingAll || ingestingIds.size > 0)
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isIngestingAll ? '采集中...' : '批量采集'}
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">名称</th>
              <th className="text-left p-2">URL</th>
              <th className="text-left p-2">分类</th>
              <th className="text-left p-2">启用</th>
              <th className="text-left p-2">状态</th>
              <th className="text-left p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t">
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
                    r.is_active ? '是' : '否'
                  )}
                </td>
                <td className="p-2 text-sm">
                  {status[r.id] ? (
                    <span className={status[r.id]?.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                      {status[r.id]?.status}
                      {status[r.id]?.status === 'success' ? ` (+${status[r.id]?.created}/~${status[r.id]?.skipped})` : ''}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-2">
                  {editingId === r.id ? (
                    <div className="flex gap-2">
                      <button onClick={onSaveEdit} className="rounded bg-black text-white px-3 py-1">保存</button>
                      <button onClick={() => { setEditingId(null); setForm({ name: '', url: '', category: '', is_active: true }); }} className="rounded border px-3 py-1">取消</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => onEditStart(r)} className="rounded border px-3 py-1">编辑</button>
                      <button onClick={() => onDelete(r.id)} className="rounded border px-3 py-1 text-red-600">删除</button>
                      <button 
                        onClick={() => onIngest(r.id)} 
                        disabled={ingestingIds.has(r.id) || isIngestingAll}
                        className={`rounded border px-3 py-1 ${
                          (ingestingIds.has(r.id) || isIngestingAll)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : 'text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {ingestingIds.has(r.id) ? '采集中...' : '采集'}
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

