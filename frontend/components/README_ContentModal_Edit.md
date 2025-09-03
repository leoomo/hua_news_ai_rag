# ContentModal 编辑功能说明

## 功能概述

`ContentModal` 组件现在支持内嵌编辑功能，用户可以在同一个弹窗中查看和编辑知识库条目的内容，无需跳转页面或打开新的编辑窗口。

## 新增功能特性

### ✏️ 编辑模式
- **一键切换**: 点击弹窗头部的编辑按钮进入编辑模式
- **实时编辑**: 支持编辑标题、内容、摘要、来源、分类
- **表单验证**: 提供友好的输入提示和验证
- **状态管理**: 编辑状态下的UI自动适配

### 🎯 编辑字段

#### 1. 标题编辑
- 位置：弹窗头部
- 样式：半透明输入框，保持视觉一致性
- 特性：实时更新，支持长标题

#### 2. 内容编辑
- 位置：主要内容区域
- 样式：大尺寸文本框，支持多行输入
- 特性：12行高度，自动滚动，保持格式

#### 3. 摘要编辑
- 位置：摘要信息卡片
- 样式：3行文本框，黄色主题
- 特性：可选字段，支持空值

#### 4. 来源编辑
- 位置：来源信息卡片
- 样式：下拉选择框，蓝色主题
- 特性：从预定义列表中选择

#### 5. 分类编辑
- 位置：分类信息卡片
- 样式：下拉选择框，绿色主题
- 特性：从预定义列表中选择

### 🔄 状态切换

#### 查看模式
- 显示所有内容信息
- 提供复制、编辑按钮
- 显示内容统计信息
- 支持键盘快捷键

#### 编辑模式
- 隐藏复制按钮
- 显示保存、取消按钮
- 隐藏内容统计信息
- 表单字段获得焦点

### 💾 保存机制

#### 保存流程
1. 用户点击保存按钮
2. 显示"保存中..."状态
3. 调用 `onSave` 回调函数
4. 成功后退出编辑模式
5. 更新本地数据状态

#### 错误处理
- 保存失败时显示错误信息
- 保持编辑状态，允许重试
- 控制台记录详细错误信息

## 使用方法

### 基本用法

```tsx
import ContentModal from '@/components/ContentModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSave = async (id: number, data: Partial<KbItem>) => {
    try {
      // 调用API保存数据
      await api.put(`/api/kb/items/${id}`, data);
      
      // 更新本地状态
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      ));
      
      return Promise.resolve();
    } catch (error) {
      console.error('保存失败:', error);
      return Promise.reject(error);
    }
  };

  return (
    <ContentModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      item={selectedItem}
      onSave={handleSave}
      categories={["分类1", "分类2", "分类3"]}
      sources={["来源1", "来源2", "来源3"]}
    />
  );
}
```

### 在知识库页面中的集成

```tsx
// 知识库页面中的使用
const handleSaveContent = async (id: number, data: Partial<KbItem>) => {
  try {
    // 调用后端API更新数据
    await api.put(`/api/kb/items/${id}`, data);
    
    // 更新本地状态
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...data, updated_at: new Date().toISOString() }
        : item
    ));
    
    // 更新筛选后的列表
    setFilteredItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...data, updated_at: new Date().toISOString() }
        : item
    ));
    
    return Promise.resolve();
  } catch (error) {
    console.error('更新失败:', error);
    return Promise.reject(error);
  }
};
```

## 组件接口

### Props 类型定义

```typescript
type ContentModalProps = {
  isOpen: boolean;                    // 弹窗显示状态
  onClose: () => void;                // 关闭弹窗回调
  item: KbItem | null;                // 要显示/编辑的项目
  onSave?: (id: number, data: Partial<KbItem>) => Promise<void>;  // 保存回调
  categories?: string[];               // 可选的分类列表
  sources?: string[];                  // 可选的来源列表
};
```

### 数据结构

```typescript
type KbItem = {
  id: number;                          // 唯一标识
  title: string;                       // 标题
  content?: string;                    // 内容
  source_name?: string;                // 来源
  category?: string;                   // 分类
  created_at?: string;                 // 创建时间
  summary?: string | null;             // 摘要
};
```

## 样式系统

### 颜色主题
- **头部渐变**: `from-blue-600 via-indigo-600 to-purple-600`
- **来源卡片**: 蓝色系 (`bg-blue-50`, `border-blue-200`)
- **分类卡片**: 绿色系 (`bg-green-50`, `border-green-200`)
- **时间卡片**: 橙色系 (`bg-orange-50`, `border-orange-200`)
- **摘要卡片**: 黄色系 (`bg-yellow-50`, `border-yellow-200`)

### 交互状态
- **悬停效果**: 按钮悬停时的颜色变化
- **焦点状态**: 输入框获得焦点时的边框高亮
- **禁用状态**: 保存按钮在保存过程中的禁用样式
- **加载状态**: 保存过程中的视觉反馈

## 无障碍支持

### 键盘导航
- **Tab键**: 在表单字段间导航
- **Enter键**: 激活按钮
- **ESC键**: 关闭弹窗或取消编辑

### 屏幕阅读器
- 适当的ARIA标签
- 状态变化通知
- 错误信息播报

## 性能优化

### 渲染优化
- 条件渲染编辑字段
- 状态变化时的最小重渲染
- 表单数据的本地状态管理

### 内存管理
- 组件卸载时清理事件监听器
- 弹窗关闭时重置编辑状态
- 避免内存泄漏

## 最佳实践

### 数据验证
- 在保存前验证必填字段
- 提供用户友好的错误提示
- 支持部分字段更新

### 用户体验
- 保存成功后提供视觉反馈
- 编辑过程中保持数据一致性
- 支持取消编辑恢复原数据

### 错误处理
- 网络错误的优雅降级
- 用户操作的确认机制
- 详细的错误日志记录

## 更新日志

### v2.0.0 (2025-09-03)
- 🆕 新增内嵌编辑功能
- ✏️ 支持编辑标题、内容、摘要、来源、分类
- 🔄 编辑模式状态切换
- 💾 保存机制和错误处理
- 🎨 编辑状态下的UI适配
- ⌨️ 键盘快捷键支持
- ♿ 无障碍访问优化

### v1.0.0 (2025-09-03)
- 初始版本发布
- 基本的内容展示功能
- 复制到剪贴板功能
- 响应式设计支持

## 故障排除

### 常见问题

1. **编辑模式无法进入**
   - 检查 `onSave` 回调是否正确传递
   - 确认 `item` 数据是否完整

2. **保存失败**
   - 检查网络连接
   - 验证API端点是否正确
   - 查看控制台错误信息

3. **样式异常**
   - 确认 Tailwind CSS 已正确安装
   - 检查是否有CSS冲突

### 调试技巧

- 使用浏览器开发者工具检查组件状态
- 查看控制台日志和错误信息
- 验证数据传递和回调函数

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个组件！

## 许可证

MIT License
