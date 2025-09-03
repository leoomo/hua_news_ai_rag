#!/usr/bin/env python3
"""
测试扩展的邮件配置API（包含发件邮箱配置）
"""

import requests
import json

BASE_URL = "http://localhost:5050"

def test_get_email_config():
    """测试获取邮件配置"""
    print("测试获取邮件配置...")
    try:
        response = requests.get(f"{BASE_URL}/api/settings/email")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

def test_update_email_config():
    """测试更新邮件配置（包含发件邮箱配置）"""
    print("\n测试更新邮件配置...")
    
    test_config = {
        "enable_email_module": True,
        "enable_email_notification": True,
        "recipient_emails": ["test@example.com", "admin@example.com"],
        "sender_name": "华新AI知识库测试系统",
        "sender_email": "test@163.com",
        "sender_password": "test_password_123",
        "email_provider": "163",
        "custom_smtp_config": {
            "smtp_host": "smtp.163.com",
            "smtp_port": 465,
            "smtp_use_tls": False,
            "smtp_use_ssl": True
        },
        "max_articles_in_email": 15,
        "email_template_language": "zh_cn",
        "email_format": "markdown",
        "email_send_timeout": 45,
        "email_retry_count": 5,
        "email_retry_delay": 10
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/settings/email",
            json=test_config,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

def test_custom_smtp_config():
    """测试自定义SMTP配置"""
    print("\n测试自定义SMTP配置...")
    
    test_config = {
        "enable_email_module": True,
        "enable_email_notification": True,
        "recipient_emails": ["test@example.com"],
        "sender_name": "华新AI知识库测试系统",
        "sender_email": "test@custom-domain.com",
        "sender_password": "custom_password",
        "email_provider": "custom",
        "custom_smtp_config": {
            "smtp_host": "smtp.custom-domain.com",
            "smtp_port": 587,
            "smtp_use_tls": True,
            "smtp_use_ssl": False
        },
        "max_articles_in_email": 10,
        "email_template_language": "zh_cn",
        "email_format": "html",
        "email_send_timeout": 30,
        "email_retry_count": 3,
        "email_retry_delay": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/settings/email",
            json=test_config,
            headers={"Content-Type": "application/json"}
        )
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

def test_health_check():
    """测试健康检查"""
    print("\n测试健康检查...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            print(f"响应: {response.json()}")
        else:
            print(f"错误响应: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    print("开始测试扩展的邮件配置API...")
    print("=" * 60)
    
    # 测试健康检查
    test_health_check()
    
    # 测试获取邮件配置
    test_get_email_config()
    
    # 测试更新邮件配置（163邮箱）
    test_update_email_config()
    
    # 测试自定义SMTP配置
    test_custom_smtp_config()
    
    print("\n测试完成！")
