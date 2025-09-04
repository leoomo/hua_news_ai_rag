'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Save, AlertCircle, User } from 'lucide-react';
import type { UserPreference, UserPreferenceFormData } from '@/lib/user-management-types';

interface PreferenceFormProps {
  preference: UserPreference | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserPreferenceFormData) => void;
  loading: boolean;
}

// 预定义的偏好设置选项
const PREFERENCE_TEMPLATES = {
  'ui.theme': {
    label: '界面主题',
    description: '设置界面显示主题',
    type: 'select',
    options: ['light', 'dark', 'auto'],
    default: 'light'
  },
  'ui.language': {
    label: '界面语言',
    description: '设置界面显示语言',
    type: 'select',
    options: ['zh-CN', 'en-US', 'ja-JP'],
    default: 'zh-CN'
  },
  'ui.timezone': {
    label: '时区设置',
    description: '设置用户时区',
    type: 'select',
    options: ['UTC', 'Asia/Shanghai', 'America/New_York', 'Europe/London'],
    default: 'Asia/Shanghai'
  },
  'display.items_per_page': {
    label: '每页显示数量',
    description: '设置列表每页显示的项目数量',
    type: 'number',
    min: 10,
    max: 100,
    default: 20
  },
  'notification.email_enabled': {
    label: '邮件通知',
    description: '是否启用邮件通知',
    type: 'boolean',
    default: true
  },
  'notification.push_enabled': {
    label: '推送通知',
    description: '是否启用推送通知',
    type: 'boolean',
    default: false
  },
  'security.two_factor_enabled': {
    label: '双因子认证',
    description: '是否启用双因子认证',
    type: 'boolean',
    default: false
  },
  'security.session_timeout': {
    label: '会话超时时间',
    description: '设置会话超时时间（分钟）',
    type: 'number',
    min: 5,
    max: 1440,
    default: 60
  }
};

export default function PreferenceForm({ preference, isOpen, onClose, onSubmit, loading }: PreferenceFormProps) {
  const [formData, setFormData] = useState<UserPreferenceFormData>({
    user_id: 0,
    preference_key: '',
    preference_value: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    if (preference) {
      // 编辑模式
      setFormData({
        user_id: preference.user_id,
        preference_key: preference.preference_key,
        preference_value: preference.preference_value || '',
      });
      setSelectedTemplate(preference.preference_key);
    } else {
      // 创建模式
      setFormData({
        user_id: 0,
        preference_key: '',
        preference_value: '',
      });
      setSelectedTemplate('');
    }
    setErrors({});
  }, [preference, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id || formData.user_id <= 0) {
      newErrors.user_id = '请选择用户';
    }

    if (!formData.preference_key.trim()) {
      newErrors.preference_key = '偏好设置键不能为空';
    }

    if (!formData.preference_value.trim()) {
      newErrors.preference_value = '偏好设置值不能为空';
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

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey) {
      const template = PREFERENCE_TEMPLATES[templateKey as keyof typeof PREFERENCE_TEMPLATES];
      setFormData(prev => ({
        ...prev,
        preference_key: templateKey,
        preference_value: template.default.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        preference_key: '',
        preference_value: ''
      }));
    }
  };

  const renderValueInput = () => {
    if (!selectedTemplate) {
      return (
        <textarea
          value={formData.preference_value}
          onChange={(e) => setFormData(prev => ({ ...prev, preference_value: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            errors.preference_value ? 'border-red-300' : 'border-gray-300'
          }`}
          rows={4}
          placeholder="输入偏好设置值（支持JSON格式）"
        />
      );
    }

    const template = PREFERENCE_TEMPLATES[selectedTemplate as keyof typeof PREFERENCE_TEMPLATES];
    
    switch (template.type) {
      case 'select':
        return (
          <select
            value={formData.preference_value}
            onChange={(e) => setFormData(prev => ({ ...prev, preference_value: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.preference_value ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {template.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={formData.preference_value}
            onChange={(e) => setFormData(prev => ({ ...prev, preference_value: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.preference_value ? 'border-red-300' : 'border-gray-300'
            }`}
            min={template.min}
            max={template.max}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={formData.preference_value}
            onChange={(e) => setFormData(prev => ({ ...prev, preference_value: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.preference_value ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="true">启用</option>
            <option value="false">禁用</option>
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={formData.preference_value}
            onChange={(e) => setFormData(prev => ({ ...prev, preference_value: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.preference_value ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="输入偏好设置值"
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {preference ? '编辑偏好设置' : '创建偏好设置'}
              </h2>
              <p className="text-sm text-gray-500">
                {preference ? '修改用户偏好设置' : '为用户创建新的偏好设置'}
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
            {/* 用户选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户 *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.user_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, user_id: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.user_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="输入用户ID"
                  min="1"
                />
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              {errors.user_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.user_id}
                </p>
              )}
            </div>

            {/* 偏好设置模板选择 */}
            {!preference && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏好设置模板
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">自定义设置</option>
                  {Object.entries(PREFERENCE_TEMPLATES).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.label} - {template.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  选择预定义模板或自定义设置
                </p>
              </div>
            )}

            {/* 偏好设置键 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                偏好设置键 *
              </label>
              <input
                type="text"
                value={formData.preference_key}
                onChange={(e) => setFormData(prev => ({ ...prev, preference_key: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.preference_key ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="例如: ui.theme, notification.email_enabled"
                disabled={!!selectedTemplate}
              />
              {errors.preference_key && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.preference_key}
                </p>
              )}
              {selectedTemplate && (
                <p className="mt-1 text-xs text-gray-500">
                  {PREFERENCE_TEMPLATES[selectedTemplate as keyof typeof PREFERENCE_TEMPLATES]?.description}
                </p>
              )}
            </div>

            {/* 偏好设置值 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                偏好设置值 *
              </label>
              {renderValueInput()}
              {errors.preference_value && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.preference_value}
                </p>
              )}
            </div>

            {/* 使用说明 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-2">使用说明</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 偏好设置键建议使用点分隔的命名方式，如 ui.theme</li>
                <li>• 偏好设置值支持字符串、数字、布尔值和JSON格式</li>
                <li>• 系统会自动验证设置值的格式和有效性</li>
                <li>• 删除偏好设置会恢复为系统默认值</li>
              </ul>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存偏好设置</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
