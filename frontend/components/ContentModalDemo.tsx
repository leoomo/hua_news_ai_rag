'use client';
import { useState } from 'react';
import ContentModal from './ContentModal';

// 演示用的示例数据
const demoItems = [
  {
    id: 1,
    title: "人工智能在医疗领域的应用",
    content: `人工智能技术在医疗领域的应用正在快速发展，为医疗行业带来了革命性的变化。

主要应用领域包括：

1. 医学影像诊断
   - 利用深度学习算法分析X光片、CT扫描、MRI等医学影像
   - 提高诊断准确率，减少漏诊和误诊
   - 辅助医生进行疾病筛查和早期诊断

2. 药物研发
   - 通过机器学习加速药物分子设计
   - 预测药物相互作用和副作用
   - 优化临床试验设计

3. 个性化医疗
   - 基于患者基因信息和病史制定治疗方案
   - 预测疾病风险和预后
   - 优化用药剂量和时机

4. 智能医疗设备
   - 可穿戴设备监测患者健康状况
   - 智能手术机器人辅助手术
   - 远程医疗和健康管理

这些技术的应用不仅提高了医疗效率和质量，还为患者提供了更好的医疗体验。`,
    source_url: "https://www.stdaily.com/",
    source_name: "科技日报",
    category: "人工智能",
    created_at: "2025-09-03T10:30:00Z",
    summary: "本文介绍了AI在医疗领域的四大主要应用：医学影像诊断、药物研发、个性化医疗和智能医疗设备。"
  },
  {
    id: 2,
    title: "区块链技术在供应链管理中的创新应用",
    content: `区块链技术凭借其去中心化、不可篡改和透明性等特性，正在供应链管理领域发挥重要作用。

核心优势：

• 透明度提升：所有交易记录都公开透明，可追溯
• 安全性增强：数据不可篡改，防止欺诈和造假
• 效率优化：减少中间环节，降低交易成本
• 信任建立：通过智能合约自动执行，减少人为干预

实际应用案例：

1. 食品溯源
   - 从农场到餐桌的全程追踪
   - 确保食品安全和质量
   - 快速定位问题源头

2. 奢侈品防伪
   - 产品身份认证
   - 防止假冒伪劣
   - 保护品牌价值

3. 跨境贸易
   - 简化清关流程
   - 提高通关效率
   - 降低贸易成本

未来发展趋势：
- 与物联网技术结合
- 引入人工智能优化决策
- 建立行业标准联盟`,
    source_url: "https://www.eeo.com.cn/",
    source_name: "经济观察报",
    category: "区块链",
    created_at: "2025-09-03T14:15:00Z",
    summary: "区块链技术在供应链管理中的应用优势包括透明度提升、安全性增强、效率优化和信任建立。"
  }
];

export default function ContentModalDemo() {
  const [selectedItem, setSelectedItem] = useState<typeof demoItems[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [demoItemsState, setDemoItemsState] = useState(demoItems);

  const openModal = (item: typeof demoItems[0]) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // 模拟保存功能
  const handleSave = async (id: number, data: Partial<typeof demoItems[0]>) => {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新本地数据
    setDemoItemsState(prev => prev.map(item => 
      item.id === id ? { ...item, ...data } : item
    ));
    
    // 更新选中的项目
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem({ ...selectedItem, ...data });
    }
    
    // 显示成功提示
    alert('保存成功！');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">内容弹窗功能演示</h1>
        <p className="text-gray-600">点击下方的内容预览来体验弹窗功能，支持查看和编辑</p>
      </div>

      <div className="space-y-6">
        {demoItemsState.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {item.source_name}
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {item.category}
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    {new Date(item.created_at).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-gray-600 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <span className="font-medium text-yellow-800">摘要：</span>
                    {item.summary}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">内容预览</h4>
                <button
                  onClick={() => openModal(item)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  <span>查看完整内容</span>
                </button>
              </div>
              <div className="text-gray-600 text-sm leading-relaxed">
                {item.content.substring(0, 200)}...
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 内容弹窗 */}
      {selectedItem && (
        <ContentModal
          isOpen={isModalOpen}
          onClose={closeModal}
          item={selectedItem}
          onSave={handleSave}
          categories={["人工智能", "区块链", "云计算", "大数据", "物联网"]}
          sources={["科技日报", "经济观察报", "人民日报", "新华社", "央视新闻"]}
        />
      )}

      {/* 使用说明 */}
      <div className="mt-12 bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">功能特性</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">🎯 交互体验</h4>
            <ul className="space-y-1">
              <li>• 点击内容预览按钮打开弹窗</li>
              <li>• 支持键盘ESC键关闭</li>
              <li>• 点击外部区域关闭弹窗</li>
              <li>• 平滑的动画过渡效果</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">✨ 功能亮点</h4>
            <ul className="space-y-1">
              <li>• 美观的渐变色彩设计</li>
              <li>• 响应式布局适配</li>
              <li>• 内容复制功能</li>
              <li>• 详细的元信息展示</li>
              <li>• <strong>新增：内嵌编辑功能</strong></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
          <h4 className="font-medium mb-2 text-blue-900">🆕 新增编辑功能</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 在弹窗中直接编辑标题、内容、摘要</li>
            <li>• 支持修改来源和分类</li>
            <li>• 实时预览编辑效果</li>
            <li>• 保存和取消编辑操作</li>
            <li>• 编辑状态下隐藏复制按钮</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
