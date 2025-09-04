#!/usr/bin/env python3
"""
后端项目初始化脚本
用于设置Python环境、安装依赖、配置数据库等
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def get_project_root():
    """获取项目根目录"""
    return Path(__file__).parent.parent

def check_python_version():
    """检查Python版本"""
    print("🐍 检查Python版本...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print(f"❌ Python版本过低: {version.major}.{version.minor}")
        print("   需要Python 3.11或更高版本")
        return False
    print(f"✅ Python版本: {version.major}.{version.minor}.{version.micro}")
    return True

def check_uv_installed():
    """检查uv是否已安装"""
    try:
        result = subprocess.run(['uv', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ uv已安装: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ uv未安装")
    return False

def install_uv():
    """安装uv包管理器"""
    print("📦 正在安装uv包管理器...")
    try:
        if platform.system() == "Windows":
            # Windows安装
            subprocess.run([
                "powershell", "-c", 
                "irm https://astral.sh/uv/install.ps1 | iex"
            ], check=True)
        else:
            # Linux/macOS安装
            subprocess.run([
                "curl", "-LsSf", "https://astral.sh/uv/install.sh"
            ], check=True, shell=True)
        
        print("✅ uv安装完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ uv安装失败: {e}")
        return False

def create_virtual_environment():
    """创建虚拟环境"""
    print("🔧 创建Python虚拟环境...")
    project_root = get_project_root()
    venv_path = project_root / ".venv"
    
    if venv_path.exists():
        print("ℹ️  虚拟环境已存在")
        return True
    
    try:
        # 使用uv创建虚拟环境
        subprocess.run([
            "uv", "venv", str(venv_path), "--python", "3.11"
        ], check=True, cwd=project_root)
        print("✅ 虚拟环境创建完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 虚拟环境创建失败: {e}")
        return False

def install_dependencies():
    """安装项目依赖"""
    print("📦 安装项目依赖...")
    project_root = get_project_root()
    
    try:
        # 使用uv安装依赖
        subprocess.run([
            "uv", "pip", "install", "-e", "."
        ], check=True, cwd=project_root)
        print("✅ 依赖安装完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖安装失败: {e}")
        return False

def create_env_file():
    """创建环境变量文件"""
    print("⚙️  创建环境变量文件...")
    project_root = get_project_root()
    env_file = project_root / ".env"
    
    if env_file.exists():
        print("ℹ️  环境变量文件已存在")
        return True
    
    env_content = """# 华新AI知识库系统 - 环境变量配置

# 数据库配置
DATABASE_URL=sqlite:///./hua_news.db

# 安全配置
SECRET_KEY=your-secret-key-here-change-in-production

# 数据库连接池配置
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_TIMEOUT=60
DB_POOL_RECYCLE=3600

# 采集配置
FETCH_TIMEOUT_SEC=8
FETCH_RETRIES=3
RATE_LIMIT_DOMAIN_QPS=1
ENABLE_ENRICH=true
ENABLE_EMBED=true
EMBED_BATCH_SIZE=64
CHUNK_SIZE=800
CHUNK_OVERLAP=120
SIMHASH_HAMMING_THRESHOLD=4

# 百度搜索API配置（可选）
BAIDU_API_KEY=
BAIDU_SECRET_KEY=

# 网络搜索配置
ENABLE_WEB_SEARCH=true
WEB_SEARCH_FALLBACK=true

# 服务端口配置
PORT=5050
"""
    
    try:
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("✅ 环境变量文件创建完成")
        print("⚠️  请根据需要修改 .env 文件中的配置")
        return True
    except Exception as e:
        print(f"❌ 环境变量文件创建失败: {e}")
        return False

def test_backend():
    """测试后端服务"""
    print("🧪 测试后端服务...")
    project_root = get_project_root()
    backend_path = project_root / "backend"
    
    try:
        # 激活虚拟环境并测试导入
        if platform.system() == "Windows":
            python_path = project_root / ".venv" / "Scripts" / "python.exe"
        else:
            python_path = project_root / ".venv" / "bin" / "python"
        
        # 测试导入主要模块
        test_script = """
import sys
sys.path.append('backend')
try:
    from backend.config import Settings
    from backend.data.db import init_db
    from backend.core.app import create_app
    print('✅ 后端模块导入成功')
except Exception as e:
    print(f'❌ 后端模块导入失败: {e}')
    sys.exit(1)
"""
        
        result = subprocess.run([
            str(python_path), "-c", test_script
        ], check=True, cwd=project_root, capture_output=True, text=True)
        
        print(result.stdout)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 后端测试失败: {e}")
        if e.stdout:
            print(f"输出: {e.stdout}")
        if e.stderr:
            print(f"错误: {e.stderr}")
        return False

def main():
    """主函数"""
    print("🚀 华新AI知识库系统 - 后端初始化工具")
    print("=" * 50)
    
    # 检查Python版本
    if not check_python_version():
        return False
    
    # 检查并安装uv
    if not check_uv_installed():
        if not install_uv():
            return False
    
    # 创建虚拟环境
    if not create_virtual_environment():
        return False
    
    # 安装依赖
    if not install_dependencies():
        return False
    
    # 创建环境变量文件
    if not create_env_file():
        return False
    
    # 测试后端
    if not test_backend():
        return False
    
    print("\n🎉 后端初始化完成!")
    print("📋 下一步:")
    print("   1. 初始化数据库: python scripts/init_database.py")
    print("   2. 启动后端服务: cd backend && python run.py")
    print("   3. 访问API文档: http://localhost:5050/api/health")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
