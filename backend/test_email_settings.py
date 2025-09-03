#!/usr/bin/env python3
"""
测试邮件配置API
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
    """测试更新邮件配置"""
    print("\n测试更新邮件配置...")
    
    test_config = {
        "enable_email_module": True,
        "enable_email_notification": True,
        "recipient_emails": ["test@example.com", "admin@example.com"],
        "sender_name": "华新AI知识库测试系统",
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
    print("开始测试邮件配置API...")
    print("=" * 50)
    
    # 测试健康检查
    test_health_check()
    
    # 测试获取邮件配置
    test_get_email_config()
    
    # 测试更新邮件配置
    test_update_email_config()
    
    print("\n测试完成！")
