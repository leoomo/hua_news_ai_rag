#!/usr/bin/env python3
"""
华新AI知识库系统 - 一键安装脚本
自动完成整个项目的安装和配置
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def get_project_root():
    """获取项目根目录"""
    return Path(__file__).parent

def print_banner():
    """打印欢迎横幅"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                   华新AI知识库系统                            ║
║                  一键安装脚本 v1.0                           ║
╚══════════════════════════════════════════════════════════════╝
"""
    print(banner)

def check_system_requirements():
    """检查系统要求"""
    print("🔍 检查系统要求...")
    
    # 检查Python版本
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print(f"❌ Python版本过低: {version.major}.{version.minor}")
        print("   需要Python 3.11或更高版本")
        return False
    print(f"✅ Python版本: {version.major}.{version.minor}.{version.micro}")
    
    # 检查Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js版本: {version}")
        else:
            print("❌ Node.js未安装")
            return False
    except FileNotFoundError:
        print("❌ Node.js未安装")
        return False
    
    # 检查npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ npm版本: {version}")
        else:
            print("❌ npm未安装")
            return False
    except FileNotFoundError:
        print("❌ npm未安装")
        return False
    
    return True

def run_script(script_name, description):
    """运行安装脚本"""
    print(f"\n🔧 {description}...")
    script_path = get_project_root() / "scripts" / script_name
    
    if not script_path.exists():
        print(f"❌ 脚本文件不存在: {script_path}")
        return False
    
    try:
        result = subprocess.run([
            sys.executable, str(script_path)
        ], check=True, cwd=get_project_root())
        
        print(f"✅ {description}完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description}失败: {e}")
        return False

def create_startup_scripts():
    """创建启动脚本"""
    print("\n📝 创建启动脚本...")
    project_root = get_project_root()
    
    # 创建启动脚本目录
    scripts_dir = project_root / "startup_scripts"
    scripts_dir.mkdir(exist_ok=True)
    
    # 后端启动脚本
    if platform.system() == "Windows":
        backend_script = scripts_dir / "start_backend.bat"
        backend_content = """@echo off
echo 🚀 启动华新AI知识库系统后端服务...
cd /d "%~dp0\\.."
cd backend
python run.py
pause
"""
        
        frontend_script = scripts_dir / "start_frontend.bat"
        frontend_content = """@echo off
echo 🚀 启动华新AI知识库系统前端服务...
cd /d "%~dp0\\.."
cd frontend
npm run dev
pause
"""
        
        all_script = scripts_dir / "start_all.bat"
        all_content = """@echo off
echo 🚀 启动华新AI知识库系统...
cd /d "%~dp0\\.."

echo 启动后端服务...
start "后端服务" cmd /k "cd backend && python run.py"

timeout /t 3 /nobreak >nul

echo 启动前端服务...
start "前端服务" cmd /k "cd frontend && npm run dev"

echo ✅ 服务启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5050
echo 默认账户: admin / admin123
pause
"""
    else:
        backend_script = scripts_dir / "start_backend.sh"
        backend_content = """#!/bin/bash
echo "🚀 启动华新AI知识库系统后端服务..."
cd "$(dirname "$0")/.."
cd backend
python run.py
"""
        
        frontend_script = scripts_dir / "start_frontend.sh"
        frontend_content = """#!/bin/bash
echo "🚀 启动华新AI知识库系统前端服务..."
cd "$(dirname "$0")/.."
cd frontend
npm run dev
"""
        
        all_script = scripts_dir / "start_all.sh"
        all_content = """#!/bin/bash
echo "🚀 启动华新AI知识库系统..."

# 启动后端服务
echo "启动后端服务..."
cd "$(dirname "$0")/.."
cd backend
python run.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:5050"
echo "默认账户: admin / admin123"
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
"""
    
    try:
        # 写入后端启动脚本
        with open(backend_script, 'w', encoding='utf-8') as f:
            f.write(backend_content)
        
        # 写入前端启动脚本
        with open(frontend_script, 'w', encoding='utf-8') as f:
            f.write(frontend_content)
        
        # 写入一键启动脚本
        with open(all_script, 'w', encoding='utf-8') as f:
            f.write(all_content)
        
        # 设置执行权限（Linux/macOS）
        if platform.system() != "Windows":
            os.chmod(backend_script, 0o755)
            os.chmod(frontend_script, 0o755)
            os.chmod(all_script, 0o755)
        
        print("✅ 启动脚本创建完成")
        print(f"   - 后端启动: {backend_script}")
        print(f"   - 前端启动: {frontend_script}")
        print(f"   - 一键启动: {all_script}")
        return True
        
    except Exception as e:
        print(f"❌ 启动脚本创建失败: {e}")
        return False

def main():
    """主函数"""
    print_banner()
    
    # 检查系统要求
    if not check_system_requirements():
        print("\n❌ 系统要求检查失败!")
        print("请安装以下软件:")
        print("- Python 3.11+")
        print("- Node.js 18+")
        print("- npm")
        return False
    
    print("\n✅ 系统要求检查通过!")
    
    # 询问用户是否继续
    response = input("\n是否继续安装? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("安装已取消")
        return False
    
    # 运行安装脚本
    scripts = [
        ("setup_backend.py", "后端环境设置"),
        ("setup_frontend.py", "前端环境设置"),
        ("init_database.py", "数据库初始化")
    ]
    
    for script, description in scripts:
        if not run_script(script, description):
            print(f"\n❌ 安装失败: {description}")
            return False
    
    # 创建启动脚本
    if not create_startup_scripts():
        print("⚠️  启动脚本创建失败，但不影响系统使用")
    
    # 安装完成
    print("\n" + "="*60)
    print("🎉 华新AI知识库系统安装完成!")
    print("="*60)
    print("\n📋 下一步操作:")
    print("1. 启动服务:")
    if platform.system() == "Windows":
        print("   - 双击 startup_scripts/start_all.bat")
        print("   - 或分别运行 start_backend.bat 和 start_frontend.bat")
    else:
        print("   - 运行 ./startup_scripts/start_all.sh")
        print("   - 或分别运行 start_backend.sh 和 start_frontend.sh")
    
    print("\n2. 访问系统:")
    print("   - 前端界面: http://localhost:3000")
    print("   - 后端API: http://localhost:5050")
    
    print("\n3. 默认账户:")
    print("   - 用户名: admin")
    print("   - 密码: admin123")
    
    print("\n⚠️  重要提醒:")
    print("   - 请及时修改默认密码")
    print("   - 生产环境请修改SECRET_KEY")
    print("   - 配置邮件服务以启用通知功能")
    
    print("\n📚 相关文档:")
    print("   - 安装指南: INSTALLATION.md")
    print("   - API文档: doc/backend_api.md")
    print("   - 系统架构: doc/system_architecture_document.md")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n安装已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 安装过程中发生错误: {e}")
        sys.exit(1)
