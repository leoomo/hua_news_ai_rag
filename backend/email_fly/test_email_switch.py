#!/usr/bin/env python3
"""
测试邮件模块开关功能
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

def test_email_module_switch():
    """测试邮件模块开关功能"""
    print("=== 测试邮件模块开关功能 ===\n")
    
    # 测试1: 检查配置导入
    try:
        from backend.email_fly.email_config import ENABLE_EMAIL_MODULE, ENABLE_EMAIL_NOTIFICATION
        print(f"✅ 配置导入成功")
        print(f"   ENABLE_EMAIL_MODULE: {ENABLE_EMAIL_MODULE}")
        print(f"   ENABLE_EMAIL_NOTIFICATION: {ENABLE_EMAIL_NOTIFICATION}")
    except ImportError as e:
        print(f"❌ 配置导入失败: {e}")
        return
    
    # 测试2: 测试EmailSender初始化
    try:
        from backend.email_fly.email_sender import EmailSender
        
        print(f"\n=== 测试EmailSender初始化 ===")
        sender = EmailSender()
        
        if hasattr(sender, 'enabled'):
            print(f"✅ EmailSender初始化成功")
            print(f"   邮件功能状态: {'启用' if sender.enabled else '禁用'}")
        else:
            print(f"❌ EmailSender初始化失败，缺少enabled属性")
            
    except Exception as e:
        print(f"❌ EmailSender初始化失败: {e}")
    
    # 测试3: 测试邮件模块导入检查
    try:
        print(f"\n=== 测试邮件模块导入检查 ===")
        
        # 模拟ingest.py中的导入逻辑
        try:
            from backend.email_fly.email_config import ENABLE_EMAIL_MODULE
            if ENABLE_EMAIL_MODULE:
                from backend.email_fly import send_rss_ingest_notification
                print(f"✅ 邮件模块导入成功，功能可用")
            else:
                print(f"ℹ️  邮件模块已通过配置禁用")
        except ImportError:
            print(f"❌ 邮件模块导入失败")
            
    except Exception as e:
        print(f"❌ 邮件模块导入检查失败: {e}")
    
    # 测试4: 显示当前配置状态
    print(f"\n=== 当前配置状态 ===")
    try:
        from backend.email_fly.email_config import (
            ENABLE_EMAIL_MODULE, ENABLE_EMAIL_NOTIFICATION, 
            EMAIL_PROVIDER, RECIPIENT_EMAILS, SENDER_NAME
        )
        
        print(f"邮件模块总开关: {'✅ 启用' if ENABLE_EMAIL_MODULE else '❌ 禁用'}")
        print(f"邮件通知开关: {'✅ 启用' if ENABLE_EMAIL_NOTIFICATION else '❌ 禁用'}")
        print(f"邮件服务商: {EMAIL_PROVIDER}")
        print(f"发件人名称: {SENDER_NAME}")
        print(f"收件人数量: {len(RECIPIENT_EMAILS)}")
        
        if ENABLE_EMAIL_MODULE and ENABLE_EMAIL_NOTIFICATION:
            print(f"\n🎯 邮件功能状态: 完全启用")
        elif ENABLE_EMAIL_MODULE and not ENABLE_EMAIL_NOTIFICATION:
            print(f"\n⚠️  邮件功能状态: 模块可用但不发送邮件")
        else:
            print(f"\n🚫 邮件功能状态: 完全禁用")
            
    except Exception as e:
        print(f"❌ 获取配置状态失败: {e}")

def test_switch_behavior():
    """测试开关行为"""
    print(f"\n=== 开关行为说明 ===")
    print(f"1. ENABLE_EMAIL_MODULE = False")
    print(f"   - 完全禁用邮件模块")
    print(f"   - 避免任何邮件相关的导入错误")
    print(f"   - 后端启动时不会尝试初始化邮件功能")
    print(f"   - 适用于不需要邮件功能或遇到邮件配置问题的环境")
    print(f"\n2. ENABLE_EMAIL_MODULE = True, ENABLE_EMAIL_NOTIFICATION = False")
    print(f"   - 邮件模块可用但不发送邮件")
    print(f"   - 适用于测试环境或临时禁用邮件发送")
    print(f"\n3. ENABLE_EMAIL_MODULE = True, ENABLE_EMAIL_NOTIFICATION = True")
    print(f"   - 邮件功能完全启用")
    print(f"   - 采集完成后自动发送邮件通知")

if __name__ == "__main__":
    test_email_module_switch()
    test_switch_behavior()
    
    print(f"\n=== 使用建议 ===")
    print(f"• 如果遇到邮件相关错误，设置 ENABLE_EMAIL_MODULE = False")
    print(f"• 如果需要临时禁用邮件发送，设置 ENABLE_EMAIL_NOTIFICATION = False")
    print(f"• 修改配置后需要重启后端服务")
    print(f"• 可以在 email_config.py 中快速切换配置")
