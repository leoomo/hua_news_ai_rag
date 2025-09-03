'use client';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface IngestProgressProps {
  isVisible: boolean;
  type: 'single' | 'batch';
  sourceName?: string;
  onComplete?: () => void;
  // 新增：外部状态控制
  externalStatus?: 'running' | 'success' | 'error';
  onStatusChange?: (status: 'running' | 'success' | 'error') => void;
}

export function IngestProgress({ 
  isVisible, 
  type, 
  sourceName, 
  onComplete, 
  externalStatus,
  onStatusChange 
}: IngestProgressProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'running' | 'success' | 'error'>('running');

  // 当组件显示时重置状态
  useEffect(() => {
    if (isVisible) {
      // 完全重置所有状态
      setProgress(0);
      setStatus('running');
      // 通知外部状态变化
      onStatusChange?.('running');
    } else {
      // 隐藏时也重置状态，为下次显示做准备
      setProgress(0);
      setStatus('running');
    }
  }, [isVisible, onStatusChange]);

  // 监听外部状态变化（仅同步状态与进度，不自动隐藏）
  useEffect(() => {
    if (externalStatus && externalStatus !== status) {
      setStatus(externalStatus);
      if (externalStatus === 'success' || externalStatus === 'error') {
        setProgress(100);
      }
    }
  }, [externalStatus, status]);

  useEffect(() => {
    if (isVisible && status === 'running') {
      // 模拟进度条
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isVisible, status]);

  useEffect(() => {
    if (progress >= 90 && status === 'running') {
      // 模拟完成
      setTimeout(() => {
        setProgress(100);
        setStatus('success');
        // 通知外部状态变化
        onStatusChange?.('success');
        // 不在组件内部自动隐藏，由父组件控制
      }, 500);
    }
  }, [progress, status, onStatusChange]);

  // 新增：监听外部成功状态，自动隐藏弹窗
  useEffect(() => {
    if (externalStatus === 'success' && status === 'success') {
      // 外部状态为成功且内部状态也为成功时，延迟自动隐藏（确保提示已弹出并可见一段时间）
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [externalStatus, status, onComplete]);

  // 新增：错误状态自动隐藏
  useEffect(() => {
    if (externalStatus === 'error' && status === 'error') {
      // 外部状态为错误时，延迟自动隐藏（确保提示已弹出并可见一段时间）
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [externalStatus, status, onComplete]);

  // 如果不可见，直接返回null，不渲染任何内容
  if (!isVisible) return null;

  const getTitle = () => {
    if (type === 'single') {
      return `正在采集: ${sourceName || 'RSS源'}`;
    }
    return '正在批量采集所有RSS源';
  };

  const getDescription = () => {
    if (type === 'single') {
      return '正在获取RSS源内容并处理...';
    }
    return '正在依次处理所有RSS源，请稍候...';
  };

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-96 border border-gray-200">
        {/* 标题 */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
          <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span>{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center justify-center">
          {status === 'running' && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <span className="text-blue-600 font-medium">采集中...</span>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-medium">采集完成！</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-600 font-medium">采集失败</span>
            </div>
          )}
        </div>

        {/* 进度步骤 */}
        {type === 'batch' && (
          <div className="mt-4 text-xs text-gray-500">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>解析RSS源列表</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${progress > 30 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>获取RSS内容</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${progress > 60 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>内容清洗与去重</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${progress > 90 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>入库与向量化</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
