'use client';
import { useState } from 'react';
import { Clock, Search, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TimezoneDebugger() {
  const [debugTime, setDebugTime] = useState('2025-09-03T06:54:00Z');
  const [debugResult, setDebugResult] = useState<any>(null);

  // 深度调试时间转换
  const debugTimezoneConversion = (timeString: string) => {
    try {
      const date = new Date(timeString);
      
      if (isNaN(date.getTime())) {
        return {
          success: false,
          error: '无效的时间格式'
        };
      }

      // 获取各种时间表示
      const utcTime = date.toUTCString();
      const localTime = date.toLocaleString('zh-CN');
      const isoTime = date.toISOString();
      const timestamp = date.getTime();
      
      // 获取UTC组件
      const utcYear = date.getUTCFullYear();
      const utcMonth = date.getUTCMonth() + 1;
      const utcDate = date.getUTCDate();
      const utcHours = date.getUTCHours();
      const utcMinutes = date.getUTCMinutes();
      const utcSeconds = date.getUTCSeconds();
      
      // 获取本地组件
      const localYear = date.getFullYear();
      const localMonth = date.getMonth() + 1;
      const localDate = date.getDate();
      const localHours = date.getHours();
      const localMinutes = date.getMinutes();
      const localSeconds = date.getSeconds();
      
      // 时区偏移
      const timezoneOffset = date.getTimezoneOffset();
      const timezoneOffsetHours = Math.abs(timezoneOffset / 60);
      const timezoneOffsetDirection = timezoneOffset > 0 ? 'UTC-' : 'UTC+';
      
      // 手动计算北京时间
      let beijingHours = utcHours + 8;
      let beijingDate = utcDate;
      let beijingMonth = utcMonth;
      let beijingYear = utcYear;
      
      // 处理跨日情况
      if (beijingHours >= 24) {
        beijingHours -= 24;
        beijingDate += 1;
        
        // 处理月末跨月
        const daysInMonth = new Date(utcYear, utcMonth, 0).getDate();
        if (beijingDate > daysInMonth) {
          beijingDate = 1;
          beijingMonth += 1;
          
          // 处理年末跨年
          if (beijingMonth > 12) {
            beijingMonth = 1;
            beijingYear += 1;
          }
        }
      }
      
      const beijingTime = `${beijingYear}/${String(beijingMonth).padStart(2, '0')}/${String(beijingDate).padStart(2, '0')} ${String(beijingHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;

      return {
        success: true,
        original: timeString,
        date: date,
        
        // 各种时间表示
        utcTime,
        localTime,
        isoTime,
        timestamp,
        
        // UTC组件
        utc: {
          year: utcYear,
          month: utcMonth,
          date: utcDate,
          hours: utcHours,
          minutes: utcMinutes,
          seconds: utcSeconds
        },
        
        // 本地组件
        local: {
          year: localYear,
          month: localMonth,
          date: localDate,
          hours: localHours,
          minutes: localMinutes,
          seconds: localSeconds
        },
        
        // 时区信息
        timezone: {
          offset: timezoneOffset,
          offsetHours: timezoneOffsetHours,
          offsetDirection: timezoneOffsetDirection,
          description: `${timezoneOffsetDirection}${timezoneOffsetHours}小时`
        },
        
        // 手动计算的北京时间
        beijing: {
          year: beijingYear,
          month: beijingMonth,
          date: beijingDate,
          hours: beijingHours,
          minutes: utcMinutes,
          formatted: beijingTime
        },
        
        // 分析结果
        analysis: {
          isUTC: timeString.endsWith('Z') || timeString.includes('+00:00'),
          hasTimezone: timeString.includes('+') || timeString.includes('-'),
          expectedBeijing: `UTC ${utcHours}:${String(utcMinutes).padStart(2, '0')} + 8小时 = 北京时间 ${beijingHours}:${String(utcMinutes).padStart(2, '0')}`,
          dateChange: beijingDate !== utcDate ? `日期从 ${utcDate} 变为 ${beijingDate}` : '日期无变化',
          timeChange: `时间从 ${utcHours}:${String(utcMinutes).padStart(2, '0')} 变为 ${beijingHours}:${String(utcMinutes).padStart(2, '0')}`
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '调试失败'
      };
    }
  };

  const runDebug = () => {
    const result = debugTimezoneConversion(debugTime);
    setDebugResult(result);
  };

  // 预设调试用例
  const debugCases = [
    '2025-09-03T06:54:00Z',      // 你的具体例子
    '2025-09-03T06:54:00+00:00', // 显式UTC
    '2025-09-03T06:54:00+08:00', // 北京时间
    '2025-09-03T06:54:00',       // 无时区信息
    '2025-09-03 06:54:00'        // 中文格式
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">时区深度调试器</h1>
      
      {/* 调试输入 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span>调试时区转换</span>
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              时间字符串 (深度分析)
            </label>
            <input
              type="text"
              value={debugTime}
              onChange={(e) => setDebugTime(e.target.value)}
              placeholder="例如: 2025-09-03T06:54:00Z"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={runDebug}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            开始调试
          </button>
        </div>
      </div>

      {/* 调试结果 */}
      {debugResult && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            {debugResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span>调试结果</span>
          </h2>
          
          {debugResult.success ? (
            <div className="space-y-6">
              {/* 原始信息 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">原始信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">原始字符串:</span> {debugResult.original}
                  </div>
                  <div>
                    <span className="font-medium">时间戳:</span> {debugResult.timestamp}
                  </div>
                  <div>
                    <span className="font-medium">UTC时间:</span> {debugResult.utcTime}
                  </div>
                  <div>
                    <span className="font-medium">本地时间:</span> {debugResult.localTime}
                  </div>
                </div>
              </div>

              {/* UTC组件 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">UTC组件</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                  <div><span className="font-medium">年:</span> {debugResult.utc.year}</div>
                  <div><span className="font-medium">月:</span> {debugResult.utc.month}</div>
                  <div><span className="font-medium">日:</span> {debugResult.utc.date}</div>
                  <div><span className="font-medium">时:</span> {debugResult.utc.hours}</div>
                  <div><span className="font-medium">分:</span> {debugResult.utc.minutes}</div>
                  <div><span className="font-medium">秒:</span> {debugResult.utc.seconds}</div>
                </div>
              </div>

              {/* 本地组件 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">本地组件</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                  <div><span className="font-medium">年:</span> {debugResult.local.year}</div>
                  <div><span className="font-medium">月:</span> {debugResult.local.month}</div>
                  <div><span className="font-medium">日:</span> {debugResult.local.date}</div>
                  <div><span className="font-medium">时:</span> {debugResult.local.hours}</div>
                  <div><span className="font-medium">分:</span> {debugResult.local.minutes}</div>
                  <div><span className="font-medium">秒:</span> {debugResult.local.seconds}</div>
                </div>
              </div>

              {/* 时区信息 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">时区信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">时区偏移:</span> {debugResult.timezone.description}
                  </div>
                  <div>
                    <span className="font-medium">偏移分钟:</span> {debugResult.timezone.offset}
                  </div>
                  <div>
                    <span className="font-medium">偏移小时:</span> {debugResult.timezone.offsetHours}
                  </div>
                </div>
              </div>

              {/* 手动计算的北京时间 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-2">手动计算的北京时间</h3>
                <div className="space-y-2">
                  <div className="text-xl font-mono text-purple-900">
                    {debugResult.beijing.formatted}
                  </div>
                  <div className="text-sm text-purple-700">
                    年: {debugResult.beijing.year} | 
                    月: {debugResult.beijing.month} | 
                    日: {debugResult.beijing.date} | 
                    时: {debugResult.beijing.hours} | 
                    分: {debugResult.beijing.minutes}
                  </div>
                </div>
              </div>

              {/* 分析结果 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-indigo-800 mb-2">分析结果</h3>
                <div className="space-y-2 text-sm text-indigo-700">
                  <div><span className="font-medium">是否UTC:</span> {debugResult.analysis.isUTC ? '是' : '否'}</div>
                  <div><span className="font-medium">有时区信息:</span> {debugResult.analysis.hasTimezone ? '是' : '否'}</div>
                  <div><span className="font-medium">转换逻辑:</span> {debugResult.analysis.expectedBeijing}</div>
                  <div><span className="font-medium">日期变化:</span> {debugResult.analysis.dateChange}</div>
                  <div><span className="font-medium">时间变化:</span> {debugResult.analysis.timeChange}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">
                调试失败: {debugResult.error}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 快速调试 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">快速调试用例</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {debugCases.map((debugCase, index) => (
            <button
              key={index}
              onClick={() => {
                setDebugTime(debugCase);
                setDebugResult(debugTimezoneConversion(debugCase));
              }}
              className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200"
            >
              <div className="text-sm font-medium text-gray-900">{debugCase}</div>
              <div className="text-xs text-gray-500 mt-1">点击调试</div>
            </button>
          ))}
        </div>
      </div>

      {/* 问题诊断 */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-3">🔍 你的问题诊断</h3>
        <div className="space-y-3 text-sm text-red-700">
          <p><strong>问题:</strong> 页面显示 `最近更新: 2025/09/02 06:54`</p>
          <p><strong>期望:</strong> 应该显示 `最近更新: 2025/09/03 14:54`</p>
          <p><strong>可能原因:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>数据库时间不是UTC时间，而是其他时区</li>
            <li>时间字符串格式不正确</li>
            <li>JavaScript Date对象解析有问题</li>
            <li>时区转换逻辑有bug</li>
          </ul>
          <p><strong>建议:</strong> 使用上面的调试工具分析具体的时间字符串</p>
        </div>
      </div>
    </div>
  );
}
