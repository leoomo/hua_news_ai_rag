#!/usr/bin/env python3
"""
前端项目初始化脚本
用于设置Node.js环境、安装依赖、配置构建等
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def get_project_root():
    """获取项目根目录"""
    return Path(__file__).parent.parent

def check_node_version():
    """检查Node.js版本"""
    print("🟢 检查Node.js版本...")
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js版本: {version}")
            
            # 检查版本号
            version_num = version.lstrip('v').split('.')[0]
            if int(version_num) >= 18:
                return True
            else:
                print(f"❌ Node.js版本过低: {version}")
                print("   需要Node.js 18或更高版本")
                return False
        else:
            print("❌ 无法获取Node.js版本")
            return False
    except FileNotFoundError:
        print("❌ Node.js未安装")
        return False

def check_npm_version():
    """检查npm版本"""
    print("📦 检查npm版本...")
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ npm版本: {version}")
            return True
        else:
            print("❌ 无法获取npm版本")
            return False
    except FileNotFoundError:
        print("❌ npm未安装")
        return False

def install_dependencies():
    """安装前端依赖"""
    print("📦 安装前端依赖...")
    project_root = get_project_root()
    frontend_path = project_root / "frontend"
    
    if not frontend_path.exists():
        print(f"❌ 前端目录不存在: {frontend_path}")
        return False
    
    try:
        # 安装依赖
        subprocess.run([
            "npm", "install"
        ], check=True, cwd=frontend_path)
        print("✅ 前端依赖安装完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 前端依赖安装失败: {e}")
        return False

def create_env_file():
    """创建前端环境变量文件"""
    print("⚙️  创建前端环境变量文件...")
    project_root = get_project_root()
    frontend_path = project_root / "frontend"
    env_file = frontend_path / ".env.local"
    
    if env_file.exists():
        print("ℹ️  前端环境变量文件已存在")
        return True
    
    env_content = """# 华新AI知识库系统 - 前端环境变量配置

# API基础URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050

# 应用配置
NEXT_PUBLIC_APP_NAME=华新AI知识库系统
NEXT_PUBLIC_APP_VERSION=1.0.0

# 开发配置
NODE_ENV=development
"""
    
    try:
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("✅ 前端环境变量文件创建完成")
        return True
    except Exception as e:
        print(f"❌ 前端环境变量文件创建失败: {e}")
        return False

def test_build():
    """测试前端构建"""
    print("🧪 测试前端构建...")
    project_root = get_project_root()
    frontend_path = project_root / "frontend"
    
    try:
        # 运行类型检查
        subprocess.run([
            "npm", "run", "lint"
        ], check=True, cwd=frontend_path)
        print("✅ 前端代码检查通过")
        
        # 测试构建（不生成文件）
        subprocess.run([
            "npm", "run", "build"
        ], check=True, cwd=frontend_path)
        print("✅ 前端构建测试通过")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 前端测试失败: {e}")
        return False

def create_startup_script():
    """创建启动脚本"""
    print("📝 创建启动脚本...")
    project_root = get_project_root()
    frontend_path = project_root / "frontend"
    
    # Windows启动脚本
    if platform.system() == "Windows":
        script_content = """@echo off
echo 🚀 启动华新AI知识库系统前端服务...
cd /d "%~dp0"
npm run dev
pause
"""
        script_path = frontend_path / "start_frontend.bat"
    else:
        # Linux/macOS启动脚本
        script_content = """#!/bin/bash
echo "🚀 启动华新AI知识库系统前端服务..."
cd "$(dirname "$0")"
npm run dev
"""
        script_path = frontend_path / "start_frontend.sh"
    
    try:
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        # 设置执行权限（Linux/macOS）
        if platform.system() != "Windows":
            os.chmod(script_path, 0o755)
        
        print(f"✅ 启动脚本创建完成: {script_path}")
        return True
    except Exception as e:
        print(f"❌ 启动脚本创建失败: {e}")
        return False

def main():
    """主函数"""
    print("🚀 华新AI知识库系统 - 前端初始化工具")
    print("=" * 50)
    
    # 检查Node.js版本
    if not check_node_version():
        print("\n📋 请安装Node.js 18或更高版本:")
        print("   - 访问: https://nodejs.org/")
        print("   - 或使用包管理器安装")
        return False
    
    # 检查npm版本
    if not check_npm_version():
        print("\n📋 请安装npm:")
        print("   - npm通常随Node.js一起安装")
        return False
    
    # 安装依赖
    if not install_dependencies():
        return False
    
    # 创建环境变量文件
    if not create_env_file():
        return False
    
    # 测试构建
    if not test_build():
        return False
    
    # 创建启动脚本
    if not create_startup_script():
        return False
    
    print("\n🎉 前端初始化完成!")
    print("📋 下一步:")
    print("   1. 确保后端服务已启动")
    print("   2. 启动前端服务: cd frontend && npm run dev")
    print("   3. 访问系统: http://localhost:3000")
    print("   4. 使用默认账户登录")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
