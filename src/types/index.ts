/**
 * 类型导出文件
 * 统一导出所有类型定义
 */

export * from './core.js';

// 重新导出核心接口以便使用
export type {
  DebugConfig,
  Logger,
  ModifierStates,
  ExtendedKeyboardEvent,
  ScalingConfig,
  CssValueParseResult,
  FocusConfig,
  TextSelectionConfig,
  KeyRepeatConfig,
  VisualManager,
  StateManager,
  KeyManager,
  EventManager,
  ScalingManager,
  FocusManager,
  KeyboardUtils,
  KeyStateManager,
  TextInputHandler
} from './core.js';