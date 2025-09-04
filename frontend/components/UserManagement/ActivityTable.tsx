'use client';

import { useState } from 'react';
import { Eye, Filter, Calendar, User, Activity, Globe, Monitor } from 'lucide-react';
import type { UserActivityLog } from '@/lib/user-management-types';

interface ActivityTableProps {
  activities: UserActivityLog[];
  loading: boolean;
  onViewDetails: (activity: UserActivityLog) => void;
  onFilter: (filters: any) => void;
}

export default function ActivityTable({ 
  activities, 
  loading, 
  onViewDetails, 
  onFilter 
}: ActivityTableProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

  const toggleExpanded = (activityId: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const getActivityIcon = (action: string) => {
    if (action.includes('login')) return '🔐';
    if (action.includes('logout')) return '🚪';
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('view')) return '👁️';
    if (action.includes('search')) return '🔍';
    return '📝';
  };

  const getActivityColor = (action: string) => {
    if (action.includes('login')) return 'text-green-600 bg-green-100';
    if (action.includes('logout')) return 'text-gray-600 bg-gray-100';
    if (action.includes('create')) return 'text-blue-600 bg-blue-100';
    if (action.includes('update')) return 'text-yellow-600 bg-yellow-100';
    if (action.includes('delete')) return 'text-red-600 bg-red-100';
    if (action.includes('view')) return 'text-purple-600 bg-purple-100';
    if (action.includes('search')) return 'text-indigo-600 bg-indigo-100';
    return 'text-gray-600 bg-gray-100';
  };

  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details || '{}');
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details || '无详细信息';
    }
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

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载活动日志数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
              <option value="">所有操作</option>
              <option value="login">登录</option>
              <option value="logout">登出</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="view">查看</option>
              <option value="search">搜索</option>
            </select>
            <input
              type="date"
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              placeholder="开始日期"
            />
            <input
              type="date"
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              placeholder="结束日期"
            />
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              应用筛选
            </button>
          </div>
        </div>
      </div>

      {/* 活动日志表格 */}
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">活动信息</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">用户</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">资源</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">IP地址</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">时间</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无活动日志数据</p>
                  </td>
                </tr>
              ) : (
                activities.map((activity) => {
                  const isExpanded = expandedActivities.has(activity.id);
                  
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-lg">{getActivityIcon(activity.action)}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(activity.action)}`}>
                                {activity.action}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {activity.details ? 
                                (activity.details.length > 50 ? 
                                  `${activity.details.substring(0, 50)}...` : 
                                  activity.details
                                ) : 
                                '无详细信息'
                              }
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
                            {activity.user_id ? `用户ID: ${activity.user_id}` : '匿名用户'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {activity.resource_type && activity.resource_id ? (
                            <span className="font-mono">
                              {activity.resource_type}:{activity.resource_id}
                            </span>
                          ) : (
                            <span className="text-gray-400">无</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 font-mono">
                            {activity.ip_address || '未知'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(activity.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleExpanded(activity.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={isExpanded ? "收起详情" : "展开详情"}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewDetails(activity)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
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
        
        {/* 活动详情展开区域 */}
        {activities.map((activity) => {
          const isExpanded = expandedActivities.has(activity.id);
          
          if (!isExpanded) return null;
          
          return (
            <tr key={`details-${activity.id}`} className="bg-gray-50/50">
              <td colSpan={6} className="px-6 py-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">活动详情</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">操作类型</label>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                          {activity.action}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">资源信息</label>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                          {activity.resource_type && activity.resource_id ? 
                            `${activity.resource_type}: ${activity.resource_id}` : 
                            '无'
                          }
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">IP地址</label>
                        <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                          {activity.ip_address || '未知'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">浏览器</label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                          {formatUserAgent(activity.user_agent || '')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">详细信息</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
                        {formatDetails(activity.details || '')}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">用户代理</label>
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border max-h-20 overflow-y-auto">
                        {activity.user_agent || '无'}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </div>
    </div>
  );
}
