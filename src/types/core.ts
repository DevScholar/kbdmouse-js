/**
 * 核心类型定义文件
 * 包含虚拟键盘项目的所有基础类型和接口
 */

// 调试配置接口
export interface DebugConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  showTimestamp: boolean;
}

// 日志记录器接口
export interface Logger {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  showTimestamp: boolean;
  logFunction: (message: string) => void;
  
  setLevel: (level: 'error' | 'warn' | 'info' | 'debug') => void;
  setLogFunction: (fn: (message: string) => void) => void;
  formatTimestamp: () => string;
  log: (level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
  logKeyboardEvent: (eventType: string, event: KeyboardEvent) => void;
}

// 修饰键状态接口
export interface ModifierStates {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
  capsLock: boolean;
  numLock: boolean;
  hasOtherModifiers: boolean;
}

// 按键状态接口
export interface KeyState {
  isDown: boolean;
  isRepeating: boolean;
  timestamp?: number;
}

// 键盘事件扩展接口
export interface ExtendedKeyboardEvent extends KeyboardEvent {
  isVkContainer?: boolean;
  vkKeyElement?: HTMLElement;
}

// 虚拟按键元素类型
export type VkKeyElement = HTMLElement;

// 缩放配置接口
export interface ScalingConfig {
  naturalWidth: number;
  naturalHeight: number;
  targetWidth: number;
  targetHeight: number;
  scaleX: number;
  scaleY: number;
  preserveAspectRatio: boolean;
}

// CSS值解析结果接口
export interface CssValueParseResult {
  value: number;
  unit: string;
  isValid: boolean;
}

// 焦点管理配置接口
export interface FocusConfig {
  restoreFocus: boolean;
  focusClass: string;
  lastFocusedElement: HTMLElement | null;
}

// 文本选择配置接口
export interface TextSelectionConfig {
  start: number;
  end: number;
  direction: 'forward' | 'backward' | 'none';
}

// 键重复配置接口
export interface KeyRepeatConfig {
  repeatTimer: number | null;
  repeatInterval: number; // ms between repeats
  repeatDelay: number; // ms before starting repeat
  isRepeating: boolean;
  repeatKey: HTMLElement | null;
}

// 视觉管理器接口
export interface VisualManager {
  applyKeyDownEffect: (vkKey: HTMLElement) => void;
  applyKeyUpEffect: (vkKey: HTMLElement) => void;
  applyShiftVisualEffect: (apply: boolean) => void;
  applyCapsLockVisualEffect: (apply: boolean) => void;
  applyNumLockVisualEffect: (apply: boolean) => void;
  toggleKeyState: (vkKey: HTMLElement, state: boolean) => void;
  addKeyClass: (vkKey: HTMLElement, className: string) => void;
  removeKeyClass: (vkKey: HTMLElement, className: string) => void;
  applyKeyDownVisualEffect: (vkKey: HTMLElement) => void;
  applyKeyUpVisualEffect: (vkKey: HTMLElement) => void;
}

// 状态管理器接口
export interface StateManager {
  keyDownKeys: HTMLElement[];
  keyDownModifiers: Set<string>;
  toggleStates: Map<string, boolean>;
  keyRepeatConfig: KeyRepeatConfig;
  
  isKeyDown: (vkKey: HTMLElement) => boolean;
  addKeyDownKey: (vkKey: HTMLElement) => void;
  removeKeyDownKey: (vkKey: HTMLElement) => void;
  isKeyPressed: (code: string) => boolean;
  getPressedKeys: () => HTMLElement[];
  addModifier: (modifier: string) => void;
  removeModifier: (modifier: string) => void;
  getKeyDownModifiers: () => string[];
  isModifierKeyDown: (modifier: string) => boolean;
  setToggleState: (code: string, state: boolean) => void;
  getToggleState: (code: string) => boolean;
  clearAllKeyDownKeys: () => void;
  resetModifiers: () => void;
  keyUpAllModifiers: () => void;
  resetToggleStates: () => void;
  resetAllStates: () => void;
  startRepeat: (vkKey: HTMLElement) => void;
  stopRepeat: () => void;
  getModifierStates: () => ModifierStates;
  setModifierState: (code: string, state: boolean) => void;
  toggleModifierState: (code: string) => boolean;
  setKeyState: (code: string, state: KeyState) => void;
  getKeyState: (code: string) => KeyState | null;
  removeKeyState: (code: string) => void;
  getActiveKeys: () => string[];
  getStateSummary: () => { modifiers: ModifierStates; keys: Record<string, KeyState> };
}

// 键管理器接口
export interface KeyManager {
  isPhysicalToggleKey: (vkKey: HTMLElement) => boolean;
  isModifierKey: (vkKey: HTMLElement) => boolean;
  isNormalKey: (vkKey: HTMLElement) => boolean;
  isToggleKey: (vkKey: HTMLElement) => boolean;
  isCapsLockKey: (vkKey: HTMLElement) => boolean;
  isNumLockKey: (vkKey: HTMLElement) => boolean;
  isMainKeyboardKey: (vkKey: HTMLElement) => boolean;
  findByCode: (code: string) => HTMLElement | null;
  findByKey: (key: string) => HTMLElement | null;
  findByCodeOrKey: (codeOrKey: string) => HTMLElement | null;
  filterKeys: (predicate: (key: HTMLElement) => boolean) => HTMLElement[];
  getAllKeys: () => HTMLElement[];
  getKeyCodes: () => string[];
  getKeyValues: () => string[];
  getModifierKeys: () => HTMLElement[];
  getToggleKeys: () => HTMLElement[];
  getNormalKeys: () => HTMLElement[];
  getKeyGroups: () => Record<string, HTMLElement[]>;
  getKeyStatistics: () => { total: number; modifiers: number; toggles: number; normal: number };
  validateKeys: () => { isValid: boolean; errors: string[] };
  sortKeys: (compareFn?: (a: HTMLElement, b: HTMLElement) => number) => HTMLElement[];
  searchKeys: (query: string) => HTMLElement[];
  focusKey: (key: HTMLElement) => void;
  blurKey: (key: HTMLElement) => void;
  highlightKey: (key: HTMLElement, highlight: boolean) => void;
  getKeyByIndex: (index: number) => HTMLElement | null;
  getKeyIndex: (key: HTMLElement) => number;
}

// 事件管理器接口
export interface EventManager {
  dispatchKeyDown: (vkKey: HTMLElement) => void;
  dispatchKeyUp: (vkKey: HTMLElement) => void;
  dispatchKeyPress: (vkKey: HTMLElement) => void;
  handleKeyClick: (vkKey: HTMLElement) => void;
  getLegacyKeyCode: (key: string, code: string) => number;
  getKeyLocation: (code: string) => number;
  addEventListener: (eventType: string, handler: (event: any) => void) => void;
  removeEventListener: (eventType: string, handler: (event: any) => void) => void;
  dispatchEvent: (eventType: string, data?: any) => void;
  dispatchKeyEvent: (code: string, eventType: string, detail?: any) => void;
  getKeyboardEventInfo: (event: KeyboardEvent) => { code: string; key: string; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean };
  setupKeyboardEventListeners: (handlers: {
    onKeyDown: (vkKey: HTMLElement) => void;
    onKeyUp: (vkKey: HTMLElement) => void;
    onKeyClick: (vkKey: HTMLElement) => void;
  }) => void;
  cleanupEventListeners: () => void;
  initializeFocusManagement: () => void;
  setupFocusListeners: (handlers: {
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onFocusIn?: (event: FocusEvent) => void;
    onFocusOut?: (event: FocusEvent) => void;
  }) => void;
  setupMouseListeners: (handlers: {
    onClick?: (event: MouseEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
  }) => void;
  setupTouchListeners: (handlers: {
    onTouchStart?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchCancel?: (event: TouchEvent) => void;
  }) => void;
  cleanup: () => void;
}

// 缩放管理器接口
export interface ScalingManager {
  naturalWidth: number;
  naturalHeight: number;
  currentUnits: Set<string>;
  
  parseCssValue: (value: string | null) => number;
  applyScaling: (targetElement: HTMLElement, config?: Partial<ScalingConfig>) => void;
  hasViewportUnits: () => boolean;
  hasContainerRelativeUnits: () => boolean;
}

// 焦点管理器接口
export interface FocusManager {
  activeElement: HTMLElement | null;
  focusConfig: FocusConfig;
  
  setupFocusListeners: () => void;
  initializeFocusManagement: () => void;
  saveFocus: () => void;
  restoreFocus: () => void;
  clearFocus: () => void;
  getActiveElement: () => HTMLElement | null;
  isInputElement: (element: any) => boolean;
  getSelection: () => TextSelectionConfig | null;
  setSelection: (start: number, end: number, direction?: 'forward' | 'backward' | 'none') => boolean;
  selectAll: () => boolean;
}

// 键盘工具接口
export interface KeyboardUtils {
  getLegacyKeyCode: (key: string, code: string) => number;
  getKeyLocation: (code: string) => number;
  determineKeyValue: (baseKey: string, code: string, modifiers: ModifierStates) => string;
  createKeyboardEvent: (type: 'keydown' | 'keyup' | 'keypress', key: string, code: string, modifiers: ModifierStates) => ExtendedKeyboardEvent;
}

// 键状态管理接口
export interface KeyStateManager {
  initialKeyDown: (vkKey: HTMLElement) => void;
  repeatingKeyDown: (vkKey: HTMLElement) => void;
  keyUp: (vkKey: HTMLElement) => void;
  setKeyState: (vkKey: HTMLElement, isPressed: boolean) => void;
}

// 文本输入处理器接口
export interface TextInputHandler {
  handleTextInput: (vkKey: HTMLElement) => void;
  insertText: (text: string) => void;
  deleteText: (direction: 'backspace' | 'delete') => void;
  insertNewline: () => void;
  insertTab: () => void;
}