'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isEmail } from '@/lib/validators';

type EmailConfig = {
  enable_email_module: boolean;
  enable_email_notification: boolean;
  recipient_emails: string[];
  sender_name: string;
  sender_email: string;
  sender_password: string;
  email_provider: string;
  custom_smtp_config: {
    smtp_host: string;
    smtp_port: number;
    smtp_use_tls: boolean;
    smtp_use_ssl: boolean;
  };
  max_articles_in_email: number;
  email_template_language: string;
  email_format: string;
  email_send_timeout: number;
  email_retry_count: number;
  email_retry_delay: number;
};

export default function SystemSettingsPage() {
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    enable_email_module: false,
    enable_email_notification: true,
    recipient_emails: [],
    sender_name: '华新AI知识库系统',
    sender_email: '',
    sender_password: '',
    email_provider: '163',
    custom_smtp_config: {
      smtp_host: 'smtp.your-server.com',
      smtp_port: 587,
      smtp_use_tls: true,
      smtp_use_ssl: false,
    },
    max_articles_in_email: 10,
    email_template_language: 'zh_cn',
    email_format: 'markdown',
    email_send_timeout: 30,
    email_retry_count: 3,
    email_retry_delay: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');

  // 自动清除消息
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    loadEmailConfig();
  }, []);

  async function loadEmailConfig() {
    try {
      const res = await api.get('/api/settings/email');
      if (res.data?.code === 0) {
        setEmailConfig(res.data.data);
      }
    } catch (error) {
      console.error('加载邮件配置失败:', error);
    }
  }

  async function saveEmailConfig() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 验证收件人邮箱
      for (const email of emailConfig.recipient_emails) {
        if (!isEmail(email)) {
          setError(`无效的邮箱地址: ${email}`);
          setLoading(false);
          return;
        }
      }

      const res = await api.post('/api/settings/email', emailConfig);
      if (res.data?.code === 0) {
        setSuccess('邮件配置保存成功');
        await loadEmailConfig(); // 重新加载配置
      } else {
        setError(res.data?.message || '保存失败');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  async function addRecipientEmail() {
    if (newEmail.trim() && isEmail(newEmail.trim())) {
      if (!emailConfig.recipient_emails.includes(newEmail.trim())) {
        const updatedConfig = {
          ...emailConfig,
          recipient_emails: [...emailConfig.recipient_emails, newEmail.trim()]
        };
        setEmailConfig(updatedConfig);
        setNewEmail('');
        
        // 自动保存到数据库
        try {
          const res = await api.post('/api/settings/email', updatedConfig);
          if (res.data?.code === 0) {
            setSuccess('收件人添加成功');
            setError(null);
          } else {
            setError(res.data?.message || '添加收件人失败');
            // 回滚状态
            setEmailConfig(emailConfig);
          }
        } catch (error: any) {
          setError(error.response?.data?.message || '添加收件人失败');
          // 回滚状态
          setEmailConfig(emailConfig);
        }
      } else {
        setError('该邮箱地址已存在');
      }
    } else {
      setError('请输入有效的邮箱地址');
    }
  }

  async function removeRecipientEmail(email: string) {
    const updatedConfig = {
      ...emailConfig,
      recipient_emails: emailConfig.recipient_emails.filter(e => e !== email)
    };
    setEmailConfig(updatedConfig);
    
    // 自动保存到数据库
    try {
      const res = await api.post('/api/settings/email', updatedConfig);
      if (res.data?.code === 0) {
        setSuccess('收件人删除成功');
        setError(null);
      } else {
        setError(res.data?.message || '删除收件人失败');
        // 回滚状态
        setEmailConfig(emailConfig);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '删除收件人失败');
      // 回滚状态
      setEmailConfig(emailConfig);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      addRecipientEmail();
    }
  }

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">系统设置</h1>
      
      {/* 邮件配置 */}
      <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-6 space-y-6 shadow-sm">
        <h2 className="text-xl font-medium text-gray-800 border-b pb-2">邮件配置</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* 邮件功能开关 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">功能开关</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700">
              💡 提示：您可以先配置所有设置，然后启用邮件模块。配置会立即保存并生效。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={emailConfig.enable_email_module}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  enable_email_module: e.target.checked
                })}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
              />
              <span className="text-sm font-medium text-gray-700">启用邮件模块</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={emailConfig.enable_email_notification}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  enable_email_notification: e.target.checked
                })}
                className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                disabled={!emailConfig.enable_email_module}
              />
              <span className="text-sm font-medium text-gray-700">启用邮件通知</span>
            </label>
          </div>
        </div>

        {/* 收件人配置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">收件人配置</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="输入邮箱地址"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
              <button
                onClick={addRecipientEmail}
                disabled={!newEmail.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-md border border-gray-900 hover:bg-gray-800 hover:shadow hover:-translate-y-0.5 transition-all duration-150 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:border-gray-300"
              >
                添加
              </button>
            </div>
            
            {emailConfig.recipient_emails.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">当前收件人：</p>
                <div className="flex flex-wrap gap-2">
                  {emailConfig.recipient_emails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      <span className="text-gray-700">{email}</span>
                      <button
                        onClick={() => removeRecipientEmail(email)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 邮件服务商配置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">邮件服务商配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮件服务商
              </label>
              <select
                value={emailConfig.email_provider}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  email_provider: e.target.value
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              >
                <option value="163">163邮箱</option>
                <option value="qq">QQ邮箱</option>
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo</option>
                <option value="sina">新浪邮箱</option>
                <option value="custom">自定义SMTP</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发件人邮箱
              </label>
              <input
                type="email"
                value={emailConfig.sender_email}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  sender_email: e.target.value
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="your-email@example.com"
                disabled={!emailConfig.enable_email_module}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱密码/授权码
              </label>
              <input
                type="password"
                value={emailConfig.sender_password}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  sender_password: e.target.value
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                placeholder="请输入密码或授权码"
                disabled={!emailConfig.enable_email_module}
              />
              <p className="text-xs text-gray-500 mt-1">
                Gmail使用应用专用密码，QQ/163等使用授权码
              </p>
            </div>
          </div>

          {/* 自定义SMTP配置 */}
          {emailConfig.email_provider === 'custom' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="text-md font-medium text-gray-700">自定义SMTP配置</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP服务器
                  </label>
                  <input
                    type="text"
                    value={emailConfig.custom_smtp_config.smtp_host}
                    onChange={(e) => setEmailConfig({
                      ...emailConfig,
                      custom_smtp_config: {
                        ...emailConfig.custom_smtp_config,
                        smtp_host: e.target.value
                      }
                    })}
                    className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    placeholder="smtp.your-server.com"
                    disabled={!emailConfig.enable_email_module}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP端口
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={emailConfig.custom_smtp_config.smtp_port}
                    onChange={(e) => setEmailConfig({
                      ...emailConfig,
                      custom_smtp_config: {
                        ...emailConfig.custom_smtp_config,
                        smtp_port: parseInt(e.target.value) || 587
                      }
                    })}
                    className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    disabled={!emailConfig.enable_email_module}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={emailConfig.custom_smtp_config.smtp_use_tls}
                      onChange={(e) => setEmailConfig({
                        ...emailConfig,
                        custom_smtp_config: {
                          ...emailConfig.custom_smtp_config,
                          smtp_use_tls: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      disabled={!emailConfig.enable_email_module}
                    />
                    <span className="text-sm font-medium text-gray-700">使用TLS</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={emailConfig.custom_smtp_config.smtp_use_ssl}
                      onChange={(e) => setEmailConfig({
                        ...emailConfig,
                        custom_smtp_config: {
                          ...emailConfig.custom_smtp_config,
                          smtp_use_ssl: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                      disabled={!emailConfig.enable_email_module}
                    />
                    <span className="text-sm font-medium text-gray-700">使用SSL</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 服务商说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 <strong>配置说明：</strong>
            </p>
            <ul className="text-xs text-blue-600 mt-1 space-y-1">
              <li>• <strong>Gmail：</strong>需要开启两步验证并使用应用专用密码</li>
              <li>• <strong>QQ邮箱：</strong>需要开启SMTP服务并获取授权码</li>
              <li>• <strong>163邮箱：</strong>需要开启SMTP服务并获取授权码</li>
              <li>• <strong>自定义SMTP：</strong>适用于企业邮箱或其他SMTP服务</li>
            </ul>
          </div>
        </div>

        {/* 邮件内容配置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">邮件内容配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发件人显示名称
              </label>
              <input
                type="text"
                value={emailConfig.sender_name}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  sender_name: e.target.value
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮件格式
              </label>
              <select
                value={emailConfig.email_format}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  email_format: e.target.value
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              >
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模板语言
              </label>
              <select
                value={emailConfig.email_template_language}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  email_template_language: e.target.value
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              >
                <option value="zh_cn">中文</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每封邮件最多文章数
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={emailConfig.max_articles_in_email}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  max_articles_in_email: parseInt(e.target.value) || 10
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              />
            </div>
          </div>
        </div>

        {/* 发送配置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">发送配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发送超时（秒）
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={emailConfig.email_send_timeout}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  email_send_timeout: parseInt(e.target.value) || 30
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                重试次数
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={emailConfig.email_retry_count}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  email_retry_count: parseInt(e.target.value) || 3
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                重试延迟（秒）
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={emailConfig.email_retry_delay}
                onChange={(e) => setEmailConfig({
                  ...emailConfig,
                  email_retry_delay: parseInt(e.target.value) || 5
                })}
                className="w-full rounded-md border border-gray-200 bg-white/90 px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                disabled={!emailConfig.enable_email_module}
              />
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="pt-4 border-t">
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              💾 点击保存后，配置将立即生效。如果启用了邮件模块，系统将使用新的配置发送邮件。
            </p>
          </div>
          <button
            onClick={saveEmailConfig}
            disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-md border border-gray-900 hover:bg-gray-800 hover:shadow hover:-translate-y-0.5 transition-all duration-150 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:border-gray-300"
          >
            {loading ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </main>
  );
}
