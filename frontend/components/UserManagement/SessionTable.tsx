'use client';

import { useState } from 'react';
import { Eye, Trash2, Shield, User, Globe, Monitor, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { UserSession } from '@/lib/user-management-types';

interface SessionTableProps {
  sessions: UserSession[];
  loading: boolean;
  onViewDetails: (session: UserSession) => void;
  onRevokeSession: (sessionId: number) => void;
}

export default function SessionTable({ 
  sessions, 
  loading, 
  onViewDetails, 
  onRevokeSession 
}: SessionTableProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const toggleExpanded = (sessionId: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const isSessionExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getSessionStatus = (session: UserSession) => {
    if (!session.is_active) return { text: '已禁用', color: 'text-red-600 bg-red-100' };
    if (isSessionExpired(session.expires_at)) return { text: '已过期', color: 'text-gray-600 bg-gray-100' };
    return { text: '活跃', color: 'text-green-600 bg-green-100' };
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return '未知';
    
    // 简单的用户代理解析
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return '其他浏览器';
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return '已过期';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载会话数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">会话信息</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">用户</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">状态</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">剩余时间</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">最后访问</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无会话数据</p>
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const isExpanded = expandedSessions.has(session.id);
                const status = getSessionStatus(session);
                const timeRemaining = getTimeRemaining(session.expires_at);
                
                return (
                  <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            会话 #{session.id}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 font-mono">
                            {session.session_token.substring(0, 20)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-900">
                          用户ID: {session.user_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {timeRemaining}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(session.last_accessed_at).toLocaleString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleExpanded(session.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={isExpanded ? "收起详情" : "展开详情"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewDetails(session)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRevokeSession(session.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="撤销会话"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* 会话详情展开区域 */}
      {sessions.map((session) => {
        const isExpanded = expandedSessions.has(session.id);
        
        if (!isExpanded) return null;
        
        return (
          <tr key={`details-${session.id}`} className="bg-gray-50/50">
            <td colSpan={6} className="px-6 py-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">会话详情</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">会话令牌</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                        {session.session_token}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">刷新令牌</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                        {session.refresh_token || '无'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">过期时间</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                        {new Date(session.expires_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">IP地址</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                        {session.ip_address || '未知'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">浏览器</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                        {formatUserAgent(session.user_agent || '')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">创建时间</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                        {new Date(session.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">用户代理</label>
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border max-h-20 overflow-y-auto">
                      {session.user_agent || '无'}
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        );
      })}
    </div>
  );
}
