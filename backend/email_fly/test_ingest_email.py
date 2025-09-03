#!/usr/bin/env python3
"""
测试RSS采集后的邮件发送功能
模拟新文章采集场景
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from email_fly.email_sender import EmailSender

def test_ingest_notification():
    """测试采集通知邮件发送"""
    print("🚀 测试RSS采集后的邮件通知功能")
    print("=" * 60)
    
    # 创建邮件发送器
    sender = EmailSender()
    
    if not sender.enabled:
        print("❌ 邮件通知功能已禁用")
        return False
    
    # 模拟新采集的文章数据
    new_articles = [
        {
            "title": "OpenAI发布GPT-5，性能大幅提升",
            "summary": "OpenAI今日正式发布GPT-5大语言模型，相比GPT-4在推理能力、多模态理解和代码生成等方面都有显著提升。新模型采用了更先进的训练方法，在多个基准测试中表现优异。",
            "source": "机器之心",
            "url": "https://www.jiqizhixin.com/articles/2025-01-03-gpt5-release",
            "category": "AI技术",
            "created_at": "2025-01-03 14:30:00"
        },
        {
            "title": "谷歌发布Gemini 2.0，多模态能力再升级",
            "summary": "谷歌发布Gemini 2.0版本，在多模态理解、图像生成和视频分析等方面都有重大突破。新版本支持更复杂的多模态任务，在多个领域测试中表现优异。",
            "source": "机器之心",
            "url": "https://www.jiqizhixin.com/articles/2025-01-03-gemini-2.0",
            "category": "AI技术",
            "created_at": "2025-01-03 14:35:00"
        },
        {
            "title": "Meta发布Llama 3.5，开源模型新标杆",
            "summary": "Meta发布Llama 3.5开源大语言模型，在性能、效率和可用性方面都达到了新的高度。该模型支持多种语言，在代码生成、数学推理等任务中表现突出。",
            "source": "机器之心",
            "url": "https://www.jiqizhixin.com/articles/2025-01-03-llama-3.5",
            "category": "开源AI",
            "created_at": "2025-01-03 14:40:00"
        }
    ]
    
    print(f"📰 模拟采集到 {len(new_articles)} 篇新文章")
    print("文章列表:")
    for i, article in enumerate(new_articles, 1):
        print(f"  {i}. {article['title']}")
        print(f"     来源: {article['source']} | 分类: {article['category']}")
        print(f"     时间: {article['created_at']}")
        print()
    
    print("📧 开始发送邮件通知...")
    
    try:
        # 发送邮件通知
        success = sender.send_notification(new_articles)
        
        if success:
            print("✅ 邮件通知发送成功！")
            print("📬 请检查收件箱: 99913119@qq.com")
            print("📋 邮件内容:")
            print("   - 使用Markdown格式")
            print("   - 包含新文章摘要")
            print("   - 自动转换为HTML显示")
            return True
        else:
            print("❌ 邮件通知发送失败")
            return False
            
    except Exception as e:
        print(f"❌ 发送邮件通知时出错: {str(e)}")
        return False

def main():
    """主函数"""
    print("🎯 测试目标: 验证RSS采集后的自动邮件通知功能")
    print("📧 邮件格式: Markdown (自动转换为HTML)")
    print("📮 发件人: 华新AI知识库系统")
    print("📬 收件人: 99913119@qq.com")
    print("-" * 60)
    
    # 测试邮件通知
    result = test_ingest_notification()
    
    print("\n" + "=" * 60)
    if result:
        print("🎉 测试完成！邮件通知功能正常工作")
        print("💡 现在可以:")
        print("   1. 正常使用RSS采集功能")
        print("   2. 自动接收新文章邮件通知")
        print("   3. 享受美观的Markdown格式邮件")
    else:
        print("❌ 测试失败，请检查邮件配置")
    
    return result

if __name__ == "__main__":
    main()
