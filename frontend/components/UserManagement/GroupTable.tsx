'use client';

import { useState } from 'react';
import { Edit, Trash2, Users, UserPlus, UserMinus, Eye } from 'lucide-react';
import type { UserGroup, UserGroupMember } from '@/lib/user-management-types';

interface GroupTableProps {
  groups: UserGroup[];
  loading: boolean;
  onEdit: (group: UserGroup) => void;
  onDelete: (groupId: number) => void;
  onManageMembers: (group: UserGroup) => void;
  onViewDetails: (group: UserGroup) => void;
}

export default function GroupTable({ 
  groups, 
  loading, 
  onEdit, 
  onDelete, 
  onManageMembers,
  onViewDetails 
}: GroupTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const toggleExpanded = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载用户组数据中...</span>
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
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">用户组信息</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">成员数量</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">创建者</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">创建时间</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无用户组数据</p>
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                
                return (
                  <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {group.name}
                          </div>
                          {group.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {group.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {group.member_count || 0} 个成员
                        </span>
                        <button
                          onClick={() => toggleExpanded(group.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {group.created_by ? `用户ID: ${group.created_by}` : '系统创建'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(group.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewDetails(group)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onManageMembers(group)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="管理成员"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(group)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="编辑用户组"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(group.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除用户组"
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
      
      {/* 成员详情展开区域 */}
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        
        if (!isExpanded) return null;
        
        return (
          <tr key={`members-${group.id}`} className="bg-gray-50/50">
            <td colSpan={5} className="px-6 py-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">成员列表</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-center text-gray-500 py-8">
                    <UserMinus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">成员管理功能开发中...</p>
                    <p className="text-xs text-gray-400 mt-1">
                      点击"管理成员"按钮进行成员管理
                    </p>
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
