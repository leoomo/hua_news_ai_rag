# ContentModal 内容弹窗组件

## 功能概述

`ContentModal` 是一个美观、功能丰富的内容弹窗组件，专门用于展示知识库条目的详细内容。它提供了优雅的用户体验和丰富的交互功能。

## 主要特性

### 🎨 视觉设计
- **渐变色彩**: 使用现代化的渐变色彩设计
- **圆角设计**: 采用圆角设计语言，视觉更加柔和
- **阴影效果**: 多层次阴影，增强视觉层次感
- **动画效果**: 平滑的淡入淡出和滑动动画

### 🔧 功能特性
- **内容展示**: 完整展示文章内容，支持长文本
- **元信息展示**: 显示来源、分类、创建时间等元数据
- **摘要显示**: 如果有摘要信息，会单独展示
- **内容统计**: 显示字符数、单词数、行数等统计信息
- **复制功能**: 一键复制内容到剪贴板

### ⌨️ 交互体验
- **键盘支持**: 支持ESC键关闭弹窗
- **点击关闭**: 点击外部区域关闭弹窗
- **响应式设计**: 适配不同屏幕尺寸
- **滚动支持**: 内容过长时支持滚动

## 使用方法

### 基本用法

```tsx
import ContentModal from '@/components/ContentModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div>
      <button onClick={() => openModal(myData)}>
        查看内容
      </button>

      <ContentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        item={selectedItem}
      />
    </div>
  );
}
```

### 数据结构要求

组件期望的 `item` 数据结构：

```typescript
type KbItem = {
  id: number;
  title: string;
  content?: string;
  source_name?: string;
  category?: string;
  created_at?: string;
  summary?: string | null;
};
```

### 在知识库页面中的使用

在知识库页面中，内容列现在支持点击查看：

```tsx
{/* 内容列 */}
<td className="p-4">
  {editingId === it.id ? (
    <textarea
      value={editForm.content || ''}
      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
      className="w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      rows={3}
    />
  ) : (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => openContentModal(it)}
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 group"
        title="点击查看完整内容"
      >
        <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
        <span className="max-w-[400px] truncate block">
          {it.content || '-'}
        </span>
      </button>
    </div>
  )}
</td>
```

## 样式定制

### 颜色主题

组件使用 Tailwind CSS 的颜色系统，主要颜色包括：

- **头部**: 蓝色到紫色的渐变 (`from-blue-600 via-indigo-600 to-purple-600`)
- **来源卡片**: 蓝色系 (`bg-blue-50`, `border-blue-200`)
- **分类卡片**: 绿色系 (`bg-green-50`, `border-green-200`)
- **时间卡片**: 橙色系 (`bg-orange-50`, `border-orange-200`)
- **摘要卡片**: 黄色系 (`bg-yellow-50`, `border-yellow-200`)

### 尺寸和间距

- **弹窗宽度**: `max-w-4xl` (最大宽度)
- **弹窗高度**: `max-h-[90vh]` (最大高度为视口高度的90%)
- **内边距**: `p-6` (24px)
- **卡片间距**: `gap-4` (16px)

## 键盘快捷键

- **ESC**: 关闭弹窗
- **Tab**: 在弹窗内导航
- **Enter**: 激活按钮

## 无障碍支持

- **语义化标签**: 使用适当的HTML标签
- **键盘导航**: 支持键盘操作
- **屏幕阅读器**: 提供适当的ARIA标签
- **焦点管理**: 弹窗打开时自动聚焦到关闭按钮

## 性能优化

- **条件渲染**: 只在需要时渲染弹窗
- **事件清理**: 组件卸载时清理事件监听器
- **滚动锁定**: 弹窗打开时锁定页面滚动

## 浏览器兼容性

- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+
- **移动设备**: iOS Safari 14+, Chrome Mobile 90+
- **不支持**: IE 11 及以下版本

## 故障排除

### 常见问题

1. **弹窗不显示**
   - 检查 `isOpen` 状态是否正确
   - 确认 `item` 数据是否存在

2. **样式异常**
   - 确认 Tailwind CSS 已正确安装
   - 检查是否有CSS冲突

3. **复制功能不工作**
   - 确认浏览器支持 Clipboard API
   - 检查是否有HTTPS要求

### 调试技巧

- 使用浏览器开发者工具检查DOM结构
- 查看控制台是否有错误信息
- 确认所有必要的依赖都已安装

## 更新日志

### v1.0.0 (2025-09-03)
- 初始版本发布
- 支持基本的内容展示功能
- 实现复制到剪贴板功能
- 添加键盘快捷键支持
- 响应式设计支持

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个组件！

## 许可证

MIT License
