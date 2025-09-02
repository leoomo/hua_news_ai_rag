'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isEmail, isNonEmpty } from '@/lib/validators';

type User = { id: number; username: string; email: string; role: string };

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Partial<User>>({ username: '', email: '', role: 'user' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api.get('/api/users').then((res) => setUsers(res.data?.data || res.data || []));
  }, []);
  async function refresh() {
    const res = await api.get('/api/users');
    setUsers(res.data?.data || res.data || []);
  }
  async function onCreate() {
    setError(null);
    if (!isNonEmpty(form.username || '')) return setError('请输入用户名');
    if (!isEmail(form.email || '')) return setError('请输入合法邮箱');
    await api.post('/api/users', form);
    setForm({ username: '', email: '', role: 'user' });
    refresh();
  }
  function onEditStart(u: User) {
    setEditingId(u.id);
    setForm(u);
  }
  async function onSaveEdit() {
    setError(null);
    if (!isNonEmpty(form.username || '')) return setError('请输入用户名');
    if (!isEmail(form.email || '')) return setError('请输入合法邮箱');
    await api.patch('/api/users', form);
    setEditingId(null);
    setForm({ username: '', email: '', role: 'user' });
    refresh();
  }
  async function onDelete(id: number) {
    await api.delete(`/api/users?id=${id}`);
    refresh();
  }
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">用户与角色</h1>
      <div className="rounded border bg-white p-4 space-y-3 max-w-2xl">
        <h2 className="font-medium">新增</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="rounded border px-3 py-2" placeholder="用户名" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="rounded border px-3 py-2" placeholder="邮箱" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="rounded border px-3 py-2" value={form.role || 'user'} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
            <option value="user">user</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
          <button onClick={onCreate} className="rounded bg-black text-white px-4 py-2">添加</button>
        </div>
      </div>

      <div className="rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">用户名</th>
              <th className="text-left p-2">邮箱</th>
              <th className="text-left p-2">角色</th>
              <th className="text-left p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">
                  {editingId === u.id ? (
                    <input className="w-full rounded border px-2 py-1" value={form.username || ''} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                  ) : (
                    u.username
                  )}
                </td>
                <td className="p-2">
                  {editingId === u.id ? (
                    <input className="w-full rounded border px-2 py-1" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  ) : (
                    u.email
                  )}
                </td>
                <td className="p-2">
                  {editingId === u.id ? (
                    <select className="w-full rounded border px-2 py-1" value={form.role || 'user'} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })}>
                      <option value="user">user</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    u.role
                  )}
                </td>
                <td className="p-2">
                  {editingId === u.id ? (
                    <div className="flex gap-2">
                      <button onClick={onSaveEdit} className="rounded bg-black text-white px-3 py-1">保存</button>
                      <button onClick={() => { setEditingId(null); setForm({ username: '', email: '', role: 'user' }); }} className="rounded border px-3 py-1">取消</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => onEditStart(u)} className="rounded border px-3 py-1">编辑</button>
                      <button onClick={() => onDelete(u.id)} className="rounded border px-3 py-1 text-red-600">删除</button>
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

