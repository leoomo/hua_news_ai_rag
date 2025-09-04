'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Save, AlertCircle } from 'lucide-react';
import type { UserRole, UserRoleFormData } from '@/lib/user-management-types';

interface RoleFormProps {
  role: UserRole | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserRoleFormData) => void;
  loading: boolean;
}

// 预定义的权限选项
const PERMISSION_OPTIONS = {
  '用户管理': [
    { key: 'user:read', label: '查看用户', description: '查看用户列表和详情' },
    { key: 'user:write', label: '编辑用户', description: '创建和编辑用户信息' },
    { key: 'user:delete', label: '删除用户', description: '删除用户账户' },
    { key: 'user:manage_roles', label: '管理角色', description: '分配和管理用户角色' },
  ],
  '文章管理': [
    { key: 'article:read', label: '查看文章', description: '查看新闻文章内容' },
    { key: 'article:write', label: '编辑文章', description: '创建和编辑文章' },
    { key: 'article:delete', label: '删除文章', description: '删除文章内容' },
    { key: 'article:publish', label: '发布文章', description: '发布和撤回文章' },
  ],
  'RSS管理': [
    { key: 'rss:read', label: '查看RSS源', description: '查看RSS源列表' },
    { key: 'rss:write', label: '编辑RSS源', description: '添加和编辑RSS源' },
    { key: 'rss:delete', label: '删除RSS源', description: '删除RSS源' },
    { key: 'rss:ingest', label: 'RSS抓取', description: '执行RSS内容抓取' },
  ],
  '系统管理': [
    { key: 'system:read', label: '查看系统', description: '查看系统状态和配置' },
    { key: 'system:write', label: '系统配置', description: '修改系统配置' },
    { key: 'system:logs', label: '查看日志', description: '查看系统日志' },
    { key: 'system:backup', label: '系统备份', description: '执行系统备份' },
  ],
  '搜索功能': [
    { key: 'search:read', label: '搜索内容', description: '使用搜索功能' },
    { key: 'search:advanced', label: '高级搜索', description: '使用高级搜索功能' },
  ],
};

export default function RoleForm({ role, isOpen, onClose, onSubmit, loading }: RoleFormProps) {
  const [formData, setFormData] = useState<UserRoleFormData>({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    is_system_role: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) {
      // 编辑模式
      const permissions = role.permissions ? JSON.parse(role.permissions) : [];
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        permissions,
        is_system_role: role.is_system_role,
      });
    } else {
      // 创建模式
      setFormData({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
        is_system_role: false,
      });
    }
    setErrors({});
  }, [role, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '角色名称不能为空';
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = '角色名称只能包含小写字母和下划线';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = '显示名称不能为空';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = '至少需要选择一个权限';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionKey]
        : prev.permissions.filter(p => p !== permissionKey)
    }));
  };

  const handleSelectAll = (category: string, checked: boolean) => {
    const categoryPermissions = PERMISSION_OPTIONS[category as keyof typeof PERMISSION_OPTIONS];
    const permissionKeys = categoryPermissions.map(p => p.key);
    
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...permissionKeys])]
        : prev.permissions.filter(p => !permissionKeys.includes(p))
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {role ? '编辑角色' : '创建角色'}
              </h2>
              <p className="text-sm text-gray-500">
                {role ? '修改角色信息和权限设置' : '创建新的用户角色'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如: content_manager"
                  disabled={role?.is_system_role}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  显示名称 *
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.display_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="例如: 内容管理员"
                />
                {errors.display_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.display_name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="描述角色的职责和权限范围"
              />
            </div>

            {/* 权限设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                权限设置 *
              </label>
              
              <div className="space-y-4">
                {Object.entries(PERMISSION_OPTIONS).map(([category, permissions]) => {
                  const categoryPermissions = permissions.map(p => p.key);
                  const selectedCount = formData.permissions.filter(p => categoryPermissions.includes(p)).length;
                  const isAllSelected = selectedCount === categoryPermissions.length;
                  const isPartialSelected = selectedCount > 0 && selectedCount < categoryPermissions.length;

                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">{category}</h4>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = isPartialSelected;
                            }}
                            onChange={(e) => handleSelectAll(category, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-500">
                            {selectedCount}/{categoryPermissions.length}
                          </span>
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <label key={permission.key} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.key)}
                              onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {permission.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.permissions && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.permissions}
                </p>
              )}
            </div>

            {/* 系统角色设置 */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_system_role"
                checked={formData.is_system_role}
                onChange={(e) => setFormData(prev => ({ ...prev, is_system_role: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={role?.is_system_role}
              />
              <label htmlFor="is_system_role" className="text-sm text-gray-700">
                系统角色（系统角色不能被删除）
              </label>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存角色</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
