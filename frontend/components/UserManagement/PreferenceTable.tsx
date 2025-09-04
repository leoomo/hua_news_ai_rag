'use client';

import { useState } from 'react';
import { Edit, Trash2, Settings, User, Eye, EyeOff } from 'lucide-react';
import type { UserPreference } from '@/lib/user-management-types';

interface PreferenceTableProps {
  preferences: UserPreference[];
  loading: boolean;
  onEdit: (preference: UserPreference) => void;
  onDelete: (preferenceId: number) => void;
  onViewDetails: (preference: UserPreference) => void;
}

export default function PreferenceTable({ 
  preferences, 
  loading, 
  onEdit, 
  onDelete, 
  onViewDetails 
}: PreferenceTableProps) {
  const [expandedPreferences, setExpandedPreferences] = useState<Set<number>>(new Set());

  const toggleExpanded = (preferenceId: number) => {
    const newExpanded = new Set(expandedPreferences);
    if (newExpanded.has(preferenceId)) {
      newExpanded.delete(preferenceId);
    } else {
      newExpanded.add(preferenceId);
    }
    setExpandedPreferences(newExpanded);
  };

  const formatPreferenceValue = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed;
    } catch {
      return value;
    }
  };

  const getPreferenceCategory = (key: string) => {
    if (key.startsWith('ui.')) return '界面设置';
    if (key.startsWith('notification.')) return '通知设置';
    if (key.startsWith('security.')) return '安全设置';
    if (key.startsWith('display.')) return '显示设置';
    if (key.startsWith('language.')) return '语言设置';
    return '其他设置';
  };

  const getPreferenceIcon = (key: string) => {
    if (key.includes('theme')) return '🎨';
    if (key.includes('language')) return '🌐';
    if (key.includes('notification')) return '🔔';
    if (key.includes('security')) return '🔒';
    if (key.includes('display')) return '📱';
    return '⚙️';
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载偏好设置数据中...</span>
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
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">偏好设置</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">用户</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">类别</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">创建时间</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {preferences.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无偏好设置数据</p>
                </td>
              </tr>
            ) : (
              preferences.map((preference) => {
                const isExpanded = expandedPreferences.has(preference.id);
                
                return (
                  <tr key={preference.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{getPreferenceIcon(preference.preference_key)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {preference.preference_key}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {preference.preference_value ? 
                              (preference.preference_value.length > 50 ? 
                                `${preference.preference_value.substring(0, 50)}...` : 
                                preference.preference_value
                              ) : 
                              '无值'
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
                          用户ID: {preference.user_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getPreferenceCategory(preference.preference_key)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(preference.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleExpanded(preference.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={isExpanded ? "收起详情" : "展开详情"}
                        >
                          {isExpanded ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onViewDetails(preference)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(preference)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="编辑偏好设置"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(preference.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除偏好设置"
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
      
      {/* 偏好设置详情展开区域 */}
      {preferences.map((preference) => {
        const isExpanded = expandedPreferences.has(preference.id);
        
        if (!isExpanded) return null;
        
        return (
          <tr key={`details-${preference.id}`} className="bg-gray-50/50">
            <td colSpan={5} className="px-6 py-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">偏好设置详情</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">设置键</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                        {preference.preference_key}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">设置值</label>
                      <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto">
                        {preference.preference_value ? formatPreferenceValue(preference.preference_value) : '无值'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">创建时间</label>
                      <div className="text-sm text-gray-900">
                        {new Date(preference.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">更新时间</label>
                      <div className="text-sm text-gray-900">
                        {new Date(preference.updated_at).toLocaleString('zh-CN')}
                      </div>
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
