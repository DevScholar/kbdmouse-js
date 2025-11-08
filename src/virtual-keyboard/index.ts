/**
 * 虚拟键盘模块 - 主入口文件
 * 提供虚拟键盘的核心功能和管理器
 */

// 导出核心类型
export * from '../types/index.js';

// 导出管理器
export { createVisualManager } from './visual-manager.js';
export { createStateManager } from './state-manager.js';
export { createKeyManager } from './key-manager.js';
export { createEventManager } from './event-manager.js';
export { createScalingManager } from './scaling-manager.js';

// 导出工具函数
export * from './keyboard-utils.js';

// 导出Logger
export * from '../utils/logger.js';

// 导入管理器
import { createVisualManager } from './visual-manager.js';
import { createStateManager } from './state-manager.js';
import { createKeyManager } from './key-manager.js';
import { createEventManager } from './event-manager.js';
import { createScalingManager } from './scaling-manager.js';
import { getGlobalLogger } from '../utils/logger.js';

/**
 * 虚拟键盘管理器
 * 整合所有管理器的核心管理器
 */
export interface VirtualKeyboardManager {
  visual: any;
  state: any;
  key: any;
  event: any;
  scaling: any;
  logger: any;
}

/**
 * 创建虚拟键盘管理器
 */
export function createVirtualKeyboardManager(container: HTMLElement): VirtualKeyboardManager {
  return {
    visual: createVisualManager(container),
    state: createStateManager(),
    key: createKeyManager(container),
    event: createEventManager(container),
    scaling: createScalingManager(container),
    logger: getGlobalLogger()
  };
}