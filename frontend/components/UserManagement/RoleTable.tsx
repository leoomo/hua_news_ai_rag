'use client';

import { useState } from 'react';
import { Edit, Trash2, Shield, Users, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '@/lib/user-management-types';

interface RoleTableProps {
  roles: UserRole[];
  loading: boolean;
  onEdit: (role: UserRole) => void;
  onDelete: (roleId: number) => void;
  onViewPermissions: (role: UserRole) => void;
}

export default function RoleTable({ 
  roles, 
  loading, 
  onEdit, 
  onDelete, 
  onViewPermissions 
}: RoleTableProps) {
  const [expandedPermissions, setExpandedPermissions] = useState<Set<number>>(new Set());

  const togglePermissions = (roleId: number) => {
    const newExpanded = new Set(expandedPermissions);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedPermissions(newExpanded);
  };

  const formatPermissions = (permissions: string) => {
    try {
      const perms = JSON.parse(permissions || '[]');
      return perms;
    } catch {
      return [];
    }
  };

  const getPermissionCategory = (permission: string) => {
    if (permission.startsWith('user:')) return '用户管理';
    if (permission.startsWith('article:')) return '文章管理';
    if (permission.startsWith('rss:')) return 'RSS管理';
    if (permission.startsWith('system:')) return '系统管理';
    if (permission.startsWith('search:')) return '搜索功能';
    return '其他';
  };

  const getPermissionIcon = (permission: string) => {
    if (permission.includes('read')) return '👁️';
    if (permission.includes('write')) return '✏️';
    if (permission.includes('delete')) return '🗑️';
    return '⚙️';
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载角色数据中...</span>
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
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">角色信息</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">权限数量</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">系统角色</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">创建时间</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无角色数据</p>
                </td>
              </tr>
            ) : (
              roles.map((role) => {
                const permissions = formatPermissions(role.permissions || '[]');
                const isExpanded = expandedPermissions.has(role.id);
                
                return (
                  <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {role.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {role.name}
                          </div>
                          {role.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {permissions.length} 个权限
                        </span>
                        <button
                          onClick={() => togglePermissions(role.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        role.is_system_role 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {role.is_system_role ? '系统角色' : '自定义角色'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(role.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewPermissions(role)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看权限详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(role)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="编辑角色"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!role.is_system_role && (
                          <button
                            onClick={() => onDelete(role.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除角色"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* 权限详情展开区域 */}
      {roles.map((role) => {
        const permissions = formatPermissions(role.permissions || '[]');
        const isExpanded = expandedPermissions.has(role.id);
        
        if (!isExpanded) return null;
        
        // 按类别分组权限
        const groupedPermissions = permissions.reduce((acc: Record<string, string[]>, permission: string) => {
          const category = getPermissionCategory(permission);
          if (!acc[category]) acc[category] = [];
          acc[category].push(permission);
          return acc;
        }, {});
        
        return (
          <tr key={`permissions-${role.id}`} className="bg-gray-50/50">
            <td colSpan={5} className="px-6 py-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">权限详情</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="bg-white rounded-lg p-3 border border-gray-200">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">{category}</h5>
                      <div className="space-y-1">
                        {perms.map((permission) => (
                          <div key={permission} className="flex items-center space-x-2 text-xs">
                            <span>{getPermissionIcon(permission)}</span>
                            <span className="text-gray-600">{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </td>
          </tr>
        );
      })}
    </div>
  );
}
