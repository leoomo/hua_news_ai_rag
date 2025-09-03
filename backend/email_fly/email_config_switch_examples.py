#!/usr/bin/env python3
"""
邮件功能开关配置示例
展示如何使用不同的开关组合来控制邮件功能
"""

# ==================== 邮件功能开关配置示例 ====================

# 示例1: 完全启用邮件功能
ENABLE_EMAIL_MODULE_EXAMPLE_1 = True
ENABLE_EMAIL_NOTIFICATION_EXAMPLE_1 = True
# 效果: 🎯 邮件功能完全启用，采集完成后自动发送邮件

# 示例2: 禁用邮件发送但保留模块
ENABLE_EMAIL_MODULE_EXAMPLE_2 = True
ENABLE_EMAIL_NOTIFICATION_EXAMPLE_2 = False
# 效果: ⚠️ 邮件模块可用但不发送邮件，适用于测试环境

# 示例3: 完全禁用邮件功能
ENABLE_EMAIL_MODULE_EXAMPLE_3 = False
ENABLE_EMAIL_NOTIFICATION_EXAMPLE_3 = True  # 这个值会被忽略
# 效果: 🚫 邮件功能完全禁用，避免任何邮件相关的错误

# ==================== 使用场景说明 ====================

"""
使用场景1: 生产环境
- 设置: ENABLE_EMAIL_MODULE = True, ENABLE_EMAIL_NOTIFICATION = True
- 用途: 正常使用邮件通知功能

使用场景2: 测试环境
- 设置: ENABLE_EMAIL_MODULE = True, ENABLE_EMAIL_NOTIFICATION = False
- 用途: 测试邮件模块功能但不实际发送邮件

使用场景3: 开发环境
- 设置: ENABLE_EMAIL_MODULE = False
- 用途: 专注于其他功能开发，避免邮件配置问题

使用场景4: 邮件服务故障
- 设置: ENABLE_EMAIL_MODULE = False
- 用途: 临时禁用邮件功能，避免系统错误

使用场景5: 维护模式
- 设置: ENABLE_EMAIL_MODULE = False
- 用途: 系统维护期间禁用邮件功能
"""

# ==================== 快速切换配置 ====================

# 复制以下配置到 email_config.py 中

# 生产环境配置
PRODUCTION_CONFIG = """
# 邮件功能总开关
ENABLE_EMAIL_MODULE = True

# 邮件通知开关
ENABLE_EMAIL_NOTIFICATION = True
"""

# 测试环境配置
TESTING_CONFIG = """
# 邮件功能总开关
ENABLE_EMAIL_MODULE = True

# 邮件通知开关
ENABLE_EMAIL_NOTIFICATION = False
"""

# 开发环境配置
DEVELOPMENT_CONFIG = """
# 邮件功能总开关
ENABLE_EMAIL_MODULE = False

# 邮件通知开关 (此值在总开关为False时无效)
ENABLE_EMAIL_NOTIFICATION = True
"""

# ==================== 配置切换步骤 ====================

"""
快速切换邮件功能状态的步骤：

1. 编辑 backend/email_fly/email_config.py 文件

2. 找到以下行：
   ENABLE_EMAIL_MODULE = True  # 或 False

3. 修改为需要的值：
   - True: 启用邮件功能
   - False: 禁用邮件功能

4. 保存文件

5. 重启后端服务：
   cd backend
   python run.py

注意事项：
- 修改配置后必须重启后端服务才能生效
- 建议在修改前备份原配置文件
- 如果遇到邮件相关错误，可以临时设置为 False 来避免问题
"""
