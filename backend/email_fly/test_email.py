#!/usr/bin/env python3
"""
邮件功能测试脚本
用于测试邮件配置和发送功能
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from email_fly.email_sender import EmailSender, test_email_configuration
from email_fly.email_config import EMAIL_PROVIDER, RECIPIENT_EMAILS

def test_email_connection():
    """测试邮件服务器连接"""
    print("🔍 测试邮件服务器连接...")
    print(f"邮件服务商: {EMAIL_PROVIDER}")
    print(f"收件人: {', '.join(RECIPIENT_EMAILS)}")
    print("-" * 50)
    
    try:
        if test_email_configuration():
            print("✅ 邮件服务器连接测试成功！")
            return True
        else:
            print("❌ 邮件服务器连接测试失败！")
            return False
    except Exception as e:
        print(f"❌ 连接测试过程中出现异常: {str(e)}")
        return False

def diagnose_connection_issues():
    """诊断连接问题的详细原因"""
    print("\n🔧 详细诊断连接问题...")
    print("-" * 50)
    
    from email_fly.email_config import (
        EMAIL_PROVIDER, GMAIL_CONFIG, QQ_CONFIG, EMAIL_163_CONFIG,
        OUTLOOK_CONFIG, YAHOO_CONFIG, SINA_CONFIG, CUSTOM_CONFIG
    )
    
    # 获取当前配置
    provider_mapping = {
        "gmail": GMAIL_CONFIG,
        "qq": QQ_CONFIG,
        "163": EMAIL_163_CONFIG,
        "outlook": OUTLOOK_CONFIG,
        "yahoo": YAHOO_CONFIG,
        "sina": SINA_CONFIG,
        "custom": CUSTOM_CONFIG
    }
    
    if EMAIL_PROVIDER not in provider_mapping:
        print(f"❌ 不支持的邮件服务商: {EMAIL_PROVIDER}")
        print("支持的邮件服务商: gmail, qq, 163, outlook, yahoo, sina, custom")
        return
    
    config = provider_mapping[EMAIL_PROVIDER]
    print(f"📋 当前 {EMAIL_PROVIDER} 配置信息:")
    print(f"   SMTP服务器: {config['smtp_host']}")
    print(f"   SMTP端口: {config['smtp_port']}")
    print(f"   用户名: {config['smtp_username']}")
    print(f"   密码/授权码: {'*' * len(config['smtp_password']) if config['smtp_password'] else '未设置'}")
    print(f"   使用TLS: {config['smtp_use_tls']}")
    print(f"   使用SSL: {config['smtp_use_ssl']}")
    
    # 根据服务商提供具体的诊断建议
    print(f"\n💡 {EMAIL_PROVIDER.upper()} 服务商诊断建议:")
    
    if EMAIL_PROVIDER == "gmail":
        print("   • 确保开启了两步验证")
        print("   • 生成应用专用密码（不是登录密码）")
        print("   • 检查账户是否被锁定")
        print("   • 确认SMTP服务已启用")
        
    elif EMAIL_PROVIDER == "qq":
        print("   • 登录QQ邮箱网页版")
        print("   • 设置 → 账户 → POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务")
        print("   • 开启SMTP服务，获取授权码")
        print("   • 授权码不是QQ密码，需要单独获取")
        
    elif EMAIL_PROVIDER == "163":
        print("   • 登录163邮箱网页版")
        print("   • 设置 → POP3/SMTP/IMAP")
        print("   • 开启SMTP服务，获取授权码")
        print("   • 授权码不是登录密码，需要单独获取")
        print("   • 检查是否开启了客户端授权密码")
        
    elif EMAIL_PROVIDER == "outlook":
        print("   • 确认账户密码正确")
        print("   • 检查是否开启了应用密码")
        print("   • 确认账户没有被锁定")
        print("   • 可能需要开启\"不太安全的应用\"访问")
        
    elif EMAIL_PROVIDER == "yahoo":
        print("   • 确保开启了两步验证")
        print("   • 生成应用专用密码")
        print("   • 检查账户安全设置")
        
    elif EMAIL_PROVIDER == "sina":
        print("   • 登录新浪邮箱网页版")
        print("   • 设置 → POP3/SMTP/IMAP")
        print("   • 开启SMTP服务，获取授权码")
        
    elif EMAIL_PROVIDER == "custom":
        print("   • 确认SMTP服务器地址和端口正确")
        print("   • 检查用户名和密码是否正确")
        print("   • 确认服务器支持指定的加密方式")
    
    print(f"\n🌐 网络连接诊断:")
    import socket
    try:
        config = provider_mapping[EMAIL_PROVIDER]
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((config['smtp_host'], config['smtp_port']))
        if result == 0:
            print(f"   ✅ 可以连接到 {config['smtp_host']}:{config['smtp_port']}")
        else:
            print(f"   ❌ 无法连接到 {config['smtp_host']}:{config['smtp_port']}")
            print("   • 检查防火墙设置")
            print("   • 检查网络连接")
            print("   • 确认服务器地址和端口正确")
        sock.close()
    except Exception as e:
        print(f"   ❌ 网络诊断失败: {str(e)}")
    
    print(f"\n🔐 常见问题排查:")
    print("   1. 密码/授权码错误 - 最常见的问题")
    print("   2. SMTP服务未开启 - 需要在邮箱设置中手动开启")
    print("   3. 账户被锁定 - 登录网页版检查账户状态")
    print("   4. 网络限制 - 公司网络可能限制SMTP端口")
    print("   5. 安全设置 - 某些邮箱需要特殊的安全设置")

def test_email_sender():
    """测试邮件发送器"""
    print("\n📧 测试邮件发送器...")
    print("-" * 50)
    
    sender = EmailSender()
    
    if not sender.enabled:
        print("⚠️  邮件通知功能已禁用")
        return False
    
    if not sender.recipients:
        print("⚠️  未配置收件人邮箱")
        return False
    
    print(f"✅ 邮件发送器初始化成功")
    print(f"   服务商: {EMAIL_PROVIDER}")
    print(f"   收件人数量: {len(sender.recipients)}")
    print(f"   最大文章数: {sender.max_articles}")
    print(f"   语言: {sender.language}")
    
    return True

def test_sample_email():
    """测试发送示例邮件"""
    print("\n📨 测试发送示例邮件...")
    print("-" * 50)
    
    # 创建示例文章数据
    sample_articles = [
        {
            "title": "测试文章1 - AI技术发展趋势",
            "summary": "本文介绍了当前AI技术的主要发展趋势，包括大语言模型、多模态AI等热点领域。",
            "source": "测试来源",
            "url": "https://example.com/article1",
            "category": "技术",
            "created_at": "2025-01-03 12:00:00"
        },
        {
            "title": "测试文章2 - 机器学习应用案例",
            "summary": "通过实际案例展示机器学习在各个行业的应用，包括金融、医疗、教育等领域。",
            "source": "测试来源",
            "url": "https://example.com/article2",
            "category": "应用",
            "created_at": "2025-01-03 12:30:00"
        }
    ]
    
    sender = EmailSender()
    
    if not sender.enabled:
        print("⚠️  邮件通知功能已禁用，跳过发送测试")
        return False
    
    print(f"准备发送 {len(sample_articles)} 篇示例文章...")
    
    try:
        success = sender.send_notification(sample_articles)
        if success:
            print("✅ 示例邮件发送成功！")
            print("请检查收件箱确认邮件是否收到")
        else:
            print("❌ 示例邮件发送失败")
        return success
    except Exception as e:
        print(f"❌ 发送示例邮件时出错: {str(e)}")
        return False

def main():
    """主测试函数"""
    print("🚀 邮件模块功能测试")
    print("=" * 60)
    
    # 测试1: 连接测试
    connection_ok = test_email_connection()
    
    # 如果连接失败，提供详细诊断
    if not connection_ok:
        diagnose_connection_issues()
    
    # 测试2: 发送器测试
    sender_ok = test_email_sender()
    
    # 测试3: 示例邮件发送（仅在连接成功时）
    if connection_ok and sender_ok:
        print("\n是否要发送测试邮件？(y/n): ", end="")
        try:
            choice = input().strip().lower()
            if choice in ['y', 'yes', '是']:
                test_sample_email()
            else:
                print("跳过示例邮件发送测试")
        except KeyboardInterrupt:
            print("\n用户中断测试")
    else:
        print("\n⚠️  由于连接或配置问题，跳过示例邮件发送测试")
    
    print("\n" + "=" * 60)
    print("测试完成！")
    
    if connection_ok and sender_ok:
        print("✅ 邮件模块配置正确，可以正常使用")
    else:
        print("❌ 邮件模块存在问题，请检查配置")
        print("\n💡 建议:")
        print("   1. 查看上方的详细诊断信息")
        print("   2. 按照诊断建议逐步排查问题")
        print("   3. 重新运行测试脚本验证修复效果")

if __name__ == "__main__":
    main()
