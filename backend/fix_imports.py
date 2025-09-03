#!/usr/bin/env python3
"""
修复所有文件中的相对导入问题
将相对导入改为绝对导入
"""

import os
import re

def fix_imports_in_file(file_path):
    """修复单个文件中的相对导入"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 修复相对导入
        # 将 from ..module 改为 from module
        content = re.sub(r'from \.\.([a-zA-Z_][a-zA-Z0-9_]*)', r'from \1', content)
        # 将 from .module 改为 from module  
        content = re.sub(r'from \.([a-zA-Z_][a-zA-Z0-9_]*)', r'from \1', content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 修复完成: {file_path}")
        
    except Exception as e:
        print(f"❌ 修复失败: {file_path} - {e}")

def find_python_files(directory):
    """递归查找Python文件"""
    python_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def main():
    """主函数"""
    print("🔧 开始修复相对导入问题...")
    
    # 获取当前目录下的所有Python文件
    current_dir = os.path.dirname(os.path.abspath(__file__))
    python_files = find_python_files(current_dir)
    
    # 排除当前脚本
    python_files = [f for f in python_files if not f.endswith('fix_imports.py')]
    
    print(f"📁 找到 {len(python_files)} 个Python文件")
    
    # 修复每个文件
    for file_path in python_files:
        fix_imports_in_file(file_path)
    
    print("🎉 所有文件修复完成！")

if __name__ == '__main__':
    main()
