'use client';
import { useState } from 'react';
import ContentModal from './ContentModal';

// 测试用的示例数据
const testItem = {
  id: 1,
  title: "测试文章标题",
  content: "这是一个测试文章的内容，用于验证编辑功能是否正常工作。\n\n包含多行内容：\n- 第一行\n- 第二行\n- 第三行",
  source_url: "https://example.com",
  source_name: "测试来源",
  category: "测试分类",
  created_at: "2025-09-03T10:00:00Z",
  summary: "这是一个测试摘要，用于验证摘要编辑功能。"
};

export default function ContentModalTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSave = async (id: number, data: any) => {
    console.log('保存数据:', { id, data });
    alert(`保存成功！\nID: ${id}\n数据: ${JSON.stringify(data, null, 2)}`);
    return Promise.resolve();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">ContentModal 编辑功能测试</h1>
        <p className="text-gray-600">点击下方按钮测试编辑功能</p>
      </div>

      <div className="space-y-6">
        {/* 测试按钮 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="text-center">
            <button
              onClick={openModal}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg font-medium"
            >
              <span>打开测试弹窗</span>
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">测试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 点击上方按钮打开内容弹窗</li>
              <li>• 检查弹窗头部是否有编辑按钮（铅笔图标）</li>
              <li>• 检查弹窗底部是否有编辑按钮</li>
              <li>• 点击编辑按钮进入编辑模式</li>
              <li>• 测试保存和取消功能</li>
            </ul>
          </div>
        </div>

        {/* 测试数据预览 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">测试数据</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>标题:</strong> {testItem.title}
            </div>
            <div>
              <strong>来源:</strong> {testItem.source_name}
            </div>
            <div>
              <strong>分类:</strong> {testItem.category}
            </div>
            <div>
              <strong>创建时间:</strong> {new Date(testItem.created_at).toLocaleString('zh-CN')}
            </div>
            <div className="md:col-span-2">
              <strong>摘要:</strong> {testItem.summary}
            </div>
            <div className="md:col-span-2">
              <strong>内容:</strong> {testItem.content.substring(0, 100)}...
            </div>
          </div>
        </div>

        {/* 功能检查清单 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">功能检查清单</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">1</span>
              </div>
              <span className="text-gray-700">弹窗能正常打开和关闭</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">2</span>
              </div>
              <span className="text-gray-700">弹窗头部显示编辑按钮（铅笔图标）</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">3</span>
              </div>
              <span className="text-gray-700">弹窗底部显示编辑按钮</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">4</span>
              </div>
              <span className="text-gray-700">点击编辑按钮进入编辑模式</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">5</span>
              </div>
              <span className="text-gray-700">编辑模式下显示保存和取消按钮</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600">6</span>
              </div>
              <span className="text-gray-700">保存功能正常工作</span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容弹窗 */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        item={testItem}
        onSave={handleSave}
        categories={["测试分类1", "测试分类2", "测试分类3"]}
        sources={["测试来源1", "测试来源2", "测试来源3"]}
      />
    </div>
  );
}
