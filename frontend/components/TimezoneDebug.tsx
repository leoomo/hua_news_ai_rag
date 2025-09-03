'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Globe, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TimezoneDebug() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // 模拟从数据库获取的时间数据
  const mockDatabaseTimes = [
    "2025-01-15T10:00:00Z",           // UTC时间
    "2025-01-15T10:00:00+08:00",      // 北京时间
    "2025-01-15T10:00:00",            // 无时区信息
    "2025-01-15 10:00:00",            // 中文格式
    "2025-01-15T10:00:00.000Z"        // 带毫秒的UTC时间
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 分析时间字符串
  const analyzeTimeString = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const isValid = !isNaN(date.getTime());
      
      if (!isValid) {
        return {
          original: timeStr,
          isValid: false,
          error: '无效的时间格式'
        };
      }

      return {
        original: timeStr,
        isValid: true,
        parsedDate: date,
        utcString: date.toUTCString(),
        localString: date.toLocaleString('zh-CN'),
        isoString: date.toISOString(),
        timestamp: date.getTime(),
        timezoneOffset: date.getTimezoneOffset(),
        timezoneOffsetHours: Math.abs(date.getTimezoneOffset() / 60),
        timezoneOffsetDirection: date.getTimezoneOffset() > 0 ? 'UTC-' : 'UTC+'
      };
    } catch (error) {
      return {
        original: timeStr,
        isValid: false,
        error: error instanceof Error ? error.message : '解析失败'
      };
    }
  };

  // 获取系统时区信息
  const getSystemTimezoneInfo = () => {
    try {
      const now = new Date();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = now.getTimezoneOffset();
      const offsetHours = Math.abs(offset / 60);
      const offsetDirection = offset > 0 ? 'UTC-' : 'UTC+';
      
      return {
        timezone,
        offset,
        offsetHours,
        offsetDirection,
        currentLocalTime: now.toLocaleString('zh-CN'),
        currentUTCTime: now.toUTCString(),
        currentISOString: now.toISOString()
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '获取时区信息失败'
      };
    }
  };

  // 测试时间转换
  const testTimeConversion = () => {
    const systemInfo = getSystemTimezoneInfo();
    const timeAnalysis = mockDatabaseTimes.map(analyzeTimeString);
    
    setDebugInfo({
      systemInfo,
      timeAnalysis,
      timestamp: Date.now()
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">时区调试工具</h1>
      
      {/* 当前时间 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>当前时间</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">本地时间:</div>
            <div className="text-lg font-mono bg-blue-100 p-2 rounded">
              {currentTime.toLocaleString('zh-CN')}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">UTC时间:</div>
            <div className="text-lg font-mono bg-green-100 p-2 rounded">
              {currentTime.toUTCString()}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">时间戳:</div>
            <div className="text-lg font-mono bg-purple-100 p-2 rounded">
              {currentTime.getTime()}
            </div>
          </div>
        </div>
      </div>

      {/* 系统时区信息 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Globe className="w-5 h-5 text-green-600" />
          <span>系统时区信息</span>
        </h2>
        <div className="space-y-4">
          <button
            onClick={testTimeConversion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            分析时区信息
          </button>
          
          {debugInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">检测到的时区:</div>
                  <div className="text-lg font-mono bg-green-100 p-2 rounded">
                    {debugInfo.systemInfo.timezone || '未知'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">时区偏移:</div>
                  <div className="text-lg font-mono bg-green-100 p-2 rounded">
                    {debugInfo.systemInfo.offsetDirection}{debugInfo.systemInfo.offsetHours}小时
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 时间分析结果 */}
      {debugInfo && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span>时间分析结果</span>
          </h2>
          
          <div className="space-y-4">
            {debugInfo.timeAnalysis.map((analysis: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  {analysis.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="text-lg font-medium text-gray-800">
                    测试时间 {index + 1}: {analysis.original}
                  </h3>
                </div>
                
                {analysis.isValid ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="text-gray-600">UTC时间:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        {analysis.utcString}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-gray-600">本地时间:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        {analysis.localString}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-gray-600">ISO时间:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        {analysis.isoString}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-gray-600">时区偏移:</div>
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        {analysis.timezoneOffsetDirection}{analysis.timezoneOffsetHours}小时
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 bg-red-50 p-3 rounded">
                    错误: {analysis.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 时区问题诊断 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔍 时区问题诊断</h3>
        <div className="space-y-3 text-sm text-yellow-700">
          <p><strong>常见问题:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>数据库存储的是UTC时间，但前端显示时进行了错误的时区转换</li>
            <li>时间字符串格式不标准，导致解析错误</li>
            <li>系统时区设置与预期不符</li>
            <li>夏令时导致的时区偏移变化</li>
          </ul>
          <p className="mt-3"><strong>解决方案:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>确保数据库时间格式统一（推荐使用ISO 8601格式）</li>
            <li>前端显示时明确时区信息</li>
            <li>使用标准的时间解析方法</li>
            <li>考虑用户时区偏好设置</li>
          </ul>
        </div>
      </div>

      {/* 刷新按钮 */}
      <div className="text-center">
        <button
          onClick={() => setCurrentTime(new Date())}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          刷新时间
        </button>
      </div>
    </div>
  );
}
