/**
 * 日志记录器工具模块
 * 提供统一的日志记录功能，支持键盘事件记录
 */

import type { DebugConfig, Logger } from '../types/core.js';

// 默认调试配置
const defaultDebugConfig: DebugConfig = {
  enabled: false,
  level: 'info',
  showTimestamp: true
};

/**
 * 创建日志记录器实例
 */
export function createLogger(config: Partial<DebugConfig> = {}): Logger {
  const debugConfig = { ...defaultDebugConfig, ...config };
  
  const logger: Logger = {
    enabled: debugConfig.enabled,
    level: debugConfig.level,
    showTimestamp: debugConfig.showTimestamp,
    logFunction: (message: string) => console.log(message),
    
    // 设置日志级别
    setLevel: (level: 'error' | 'warn' | 'info' | 'debug') => {
      logger.level = level;
      logger.enabled = level !== 'error' || debugConfig.enabled;
    },
    
    // 设置自定义日志函数
    setLogFunction: (fn: (message: string) => void) => {
      logger.logFunction = fn;
    },
    
    // 格式化时间戳
    formatTimestamp: (): string => {
      if (!logger.showTimestamp) return '';
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
      return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
    },
    
    // 核心日志方法，带级别检查
    log: (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) => {
      if (!logger.enabled) return;
      
      const levels = ['error', 'warn', 'info', 'debug'];
      const currentLevelIndex = levels.indexOf(logger.level);
      const messageLevelIndex = levels.indexOf(level);
      
      if (messageLevelIndex <= currentLevelIndex) {
        const timestamp = logger.formatTimestamp();
        const logMessage = timestamp ? `${timestamp} ${message}` : message;
        
        if (level === 'error') {
          logger.logFunction(logMessage);
          if (data) console.error(data);
        } else if (level === 'warn') {
          logger.logFunction(logMessage);
          if (data) console.warn(data);
        } else {
          logger.logFunction(logMessage);
          if (data) console.log(data);
        }
      }
    },
    
    // 特定级别日志方法
    error: (message: string, data?: any) => logger.log('error', message, data),
    warn: (message: string, data?: any) => logger.log('warn', message, data),
    info: (message: string, data?: any) => logger.log('info', message, data),
    debug: (message: string, data?: any) => logger.log('debug', message, data),
    
    // 键盘事件日志 - 统一格式匹配演示页面
    logKeyboardEvent: (eventType: string, event: KeyboardEvent) => {
      if (!logger.enabled || logger.level === 'error') return;
      
      const timestamp = logger.formatTimestamp();
      const key = event.key || 'Unknown';
      const code = event.code || 'unknown';
      
      // 格式化修饰键
      const mods = [];
      if (event.ctrlKey) mods.push('c');
      if (event.altKey) mods.push('a');
      if (event.shiftKey) mods.push('s');
      if (event.metaKey) mods.push('m');
      const modStr = mods.join('');
      
      // 确定源和目标 - 匹配演示页面格式
      const source = (event as any).isVkContainer ? 'virtual' : 'physical';
      const targetName = !event.target ? 'unknown' :
                        event.target === window ? 'window' : 
                        event.target === document.activeElement ? 'textInput' : 
                        (event.target as Element).tagName || 'unknown';
      
      const logMessage = `${timestamp} event=${eventType},key=${key},code=${code},mod=${modStr},source=${source}`;
      logger.logFunction(logMessage);
    }
  };
  
  return logger;
}

/**
 * 获取全局日志记录器实例（单例模式）
 */
let globalLogger: Logger | null = null;

export function getGlobalLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger();
  }
  return globalLogger;
}

/**
 * 设置全局日志记录器配置
 */
export function setGlobalLoggerConfig(config: Partial<DebugConfig>): void {
  const logger = getGlobalLogger();
  if (config.enabled !== undefined) logger.enabled = config.enabled;
  if (config.level) logger.setLevel(config.level);
  if (config.showTimestamp !== undefined) logger.showTimestamp = config.showTimestamp;
}