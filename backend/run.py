#!/usr/bin/env python3
"""
后端服务启动文件
使用绝对导入避免相对导入问题
"""

import os
import sys

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.app import create_app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', '5050'))
    print(f"🚀 启动后端服务，端口: {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
