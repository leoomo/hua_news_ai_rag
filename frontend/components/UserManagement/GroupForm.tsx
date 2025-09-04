'use client';

import { useState, useEffect } from 'react';
import { X, Users, Save, AlertCircle } from 'lucide-react';
import type { UserGroup, UserGroupFormData } from '@/lib/user-management-types';

interface GroupFormProps {
  group: UserGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserGroupFormData) => void;
  loading: boolean;
}

export default function GroupForm({ group, isOpen, onClose, onSubmit, loading }: GroupFormProps) {
  const [formData, setFormData] = useState<UserGroupFormData>({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (group) {
      // 编辑模式
      setFormData({
        name: group.name,
        description: group.description || '',
      });
    } else {
      // 创建模式
      setFormData({
        name: '',
        description: '',
      });
    }
    setErrors({});
  }, [group, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '用户组名称不能为空';
    } else if (formData.name.length < 2) {
      newErrors.name = '用户组名称至少需要2个字符';
    } else if (formData.name.length > 100) {
      newErrors.name = '用户组名称不能超过100个字符';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = '描述不能超过500个字符';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {group ? '编辑用户组' : '创建用户组'}
              </h2>
              <p className="text-sm text-gray-500">
                {group ? '修改用户组信息' : '创建新的用户组'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户组名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例如: 内容编辑团队"
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.name.length}/100 字符
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户组描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="描述用户组的职责和用途"
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/500 字符
              </p>
            </div>

            {/* 使用说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">使用说明</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 用户组用于批量管理用户权限和角色</li>
                <li>• 创建后可以通过"管理成员"功能添加用户</li>
                <li>• 用户组可以设置不同的成员角色（管理员、普通成员等）</li>
                <li>• 删除用户组会同时移除所有成员关系</li>
              </ul>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存用户组</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
