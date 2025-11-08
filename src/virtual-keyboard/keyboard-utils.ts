/**
 * 键盘工具函数模块
 * 提供虚拟键盘相关的工具函数
 */

/**
 * 解析CSS值
 * 将CSS值解析为数值和单位
 */
export function parseCssValue(value: string): { value: number; unit: string } {
  if (!value || typeof value !== 'string') {
    return { value: 0, unit: 'px' };
  }
  
  // 匹配数字和单位
  const match = value.toString().match(/^(-?\d*\.?\d+)(.*)$/);
  
  if (match) {
    const numValue = parseFloat(match[1]);
    const unit = match[2] || 'px';
    return { value: numValue, unit };
  }
  
  // 如果没有匹配到，尝试直接解析为数字
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    return { value: numValue, unit: 'px' };
  }
  
  return { value: 0, unit: 'px' };
}

/**
 * 转换CSS单位为像素
 */
export function convertToPixels(value: string, referenceElement?: HTMLElement): number {
  const { value: numValue, unit } = parseCssValue(value);
  
  switch (unit) {
    case 'px':
      return numValue;
    case 'em':
      if (referenceElement) {
        const fontSize = parseFloat(getComputedStyle(referenceElement).fontSize);
        return numValue * fontSize;
      }
      return numValue * 16; // 默认16px
    case 'rem':
      return numValue * parseFloat(getComputedStyle(document.documentElement).fontSize);
    case '%':
      if (referenceElement && referenceElement.parentElement) {
        const parentWidth = referenceElement.parentElement.clientWidth;
        return (numValue / 100) * parentWidth;
      }
      return numValue;
    case 'vh':
      return (numValue / 100) * window.innerHeight;
    case 'vw':
      return (numValue / 100) * window.innerWidth;
    default:
      return numValue;
  }
}

/**
 * 检查是否为有效的键盘代码
 */
export function isValidKeyCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // 常见的键盘代码前缀
  const validPrefixes = [
    'Key',      // 字母键 (KeyA, KeyB, ...)
    'Digit',    // 数字键 (Digit0, Digit1, ...)
    'Numpad',   // 小键盘键 (Numpad0, Numpad1, ...)
    'Arrow',    // 方向键 (ArrowUp, ArrowDown, ...)
    'Shift',    // Shift键
    'Control',  // Ctrl键
    'Alt',      // Alt键
    'Meta',     // Meta键 (Windows键/Cmd键)
    'F',        // 功能键 (F1, F2, ...)
    'Backspace',
    'Tab',
    'Enter',
    'Escape',
    'Space',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    'Insert',
    'Delete',
    'CapsLock',
    'NumLock',
    'ScrollLock',
    'Pause',
    'ContextMenu',
    'PrintScreen',
    'Semicolon',
    'Equal',
    'Comma',
    'Minus',
    'Period',
    'Slash',
    'Backquote',
    'BracketLeft',
    'Backslash',
    'BracketRight',
    'Quote'
  ];
  
  return validPrefixes.some(prefix => code.startsWith(prefix));
}

/**
 * 获取按键的显示标签
 */
export function getKeyDisplayLabel(code: string, key: string): string {
  if (!code && !key) {
    return '';
  }
  
  // 特殊按键的显示标签
  const specialLabels: { [key: string]: string } = {
    'Backspace': '⌫',
    'Tab': 'Tab',
    'Enter': 'Enter',
    'ShiftLeft': 'Shift',
    'ShiftRight': 'Shift',
    'ControlLeft': 'Ctrl',
    'ControlRight': 'Ctrl',
    'AltLeft': 'Alt',
    'AltRight': 'Alt',
    'MetaLeft': 'Win',
    'MetaRight': 'Win',
    'CapsLock': 'Caps',
    'Escape': 'Esc',
    'Space': 'Space',
    'PageUp': 'PgUp',
    'PageDown': 'PgDn',
    'End': 'End',
    'Home': 'Home',
    'ArrowLeft': '←',
    'ArrowUp': '↑',
    'ArrowRight': '→',
    'ArrowDown': '↓',
    'PrintScreen': 'PrtSc',
    'Insert': 'Ins',
    'Delete': 'Del',
    'ContextMenu': 'Menu',
    'Pause': 'Pause',
    'NumLock': 'Num',
    'ScrollLock': 'ScrLk',
    'NumpadEnter': 'Enter',
    'NumpadMultiply': '*',
    'NumpadAdd': '+',
    'NumpadSubtract': '-',
    'NumpadDecimal': '.',
    'NumpadDivide': '/',
    'NumpadEqual': '=',
    'Semicolon': ';',
    'Equal': '=',
    'Comma': ',',
    'Minus': '-',
    'Period': '.',
    'Slash': '/',
    'Backquote': '`',
    'BracketLeft': '[',
    'Backslash': '\\',
    'BracketRight': ']',
    'Quote': "'"
  };
  
  // 检查特殊标签
  if (code && specialLabels[code]) {
    return specialLabels[code];
  }
  
  // 字母键
  if (code && code.startsWith('Key')) {
    return code.substring(3);
  }
  
  // 数字键
  if (code && code.startsWith('Digit')) {
    return code.substring(5);
  }
  
  // 小键盘数字键
  if (code && code.startsWith('Numpad') && /\d/.test(code.substring(6))) {
    return code.substring(6);
  }
  
  // 功能键
  if (code && code.startsWith('F')) {
    return code;
  }
  
  // 使用key作为备选
  return key || code || '';
}

/**
 * 检查是否为修饰键
 */
export function isModifierKey(code: string): boolean {
  if (!code) return false;
  
  return !!(code && (
    code.startsWith('Shift') || 
    code.startsWith('Control') || 
    code.startsWith('Alt') || 
    code.startsWith('Meta')
  ));
}

/**
 * 检查是否为切换键
 */
export function isToggleKey(code: string): boolean {
  if (!code) return false;
  
  return code === 'CapsLock' || code === 'NumLock' || code === 'ScrollLock';
}

/**
 * 检查是否为字母键
 */
export function isLetterKey(code: string): boolean {
  if (!code) return false;
  
  return code.startsWith('Key');
}

/**
 * 检查是否为数字键
 */
export function isNumberKey(code: string): boolean {
  if (!code) return false;
  
  return code.startsWith('Digit');
}

/**
 * 检查是否为功能键
 */
export function isFunctionKey(code: string): boolean {
  if (!code) return false;
  
  return code.startsWith('F') && /^F\d+$/.test(code);
}

/**
 * 检查是否为小键盘键
 */
export function isNumpadKey(code: string): boolean {
  if (!code) return false;
  
  return code.startsWith('Numpad');
}

/**
 * 获取按键的键位置
 */
export function getKeyLocation(code: string): number {
  if (!code) return 0;
  
  if (code.endsWith('Left')) return 1;
  if (code.endsWith('Right')) return 2;
  if (code.startsWith('Numpad')) return 3;
  return 0;
}

/**
 * 获取传统键码
 */
export function getLegacyKeyCode(code: string): number {
  if (!code) return 0;
  
  // 传统键码映射表
  const legacyKeyCodes: { [key: string]: number } = {
    'Backspace': 8,
    'Tab': 9,
    'Enter': 13,
    'ShiftLeft': 16,
    'ShiftRight': 16,
    'ControlLeft': 17,
    'ControlRight': 17,
    'AltLeft': 18,
    'AltRight': 18,
    'Pause': 19,
    'CapsLock': 20,
    'Escape': 27,
    'Space': 32,
    'PageUp': 33,
    'PageDown': 34,
    'End': 35,
    'Home': 36,
    'ArrowLeft': 37,
    'ArrowUp': 38,
    'ArrowRight': 39,
    'ArrowDown': 40,
    'PrintScreen': 44,
    'Insert': 45,
    'Delete': 46,
    'Digit0': 48,
    'Digit1': 49,
    'Digit2': 50,
    'Digit3': 51,
    'Digit4': 52,
    'Digit5': 53,
    'Digit6': 54,
    'Digit7': 55,
    'Digit8': 56,
    'Digit9': 57,
    'KeyA': 65,
    'KeyB': 66,
    'KeyC': 67,
    'KeyD': 68,
    'KeyE': 69,
    'KeyF': 70,
    'KeyG': 71,
    'KeyH': 72,
    'KeyI': 73,
    'KeyJ': 74,
    'KeyK': 75,
    'KeyL': 76,
    'KeyM': 77,
    'KeyN': 78,
    'KeyO': 79,
    'KeyP': 80,
    'KeyQ': 81,
    'KeyR': 82,
    'KeyS': 83,
    'KeyT': 84,
    'KeyU': 85,
    'KeyV': 86,
    'KeyW': 87,
    'KeyX': 88,
    'KeyY': 89,
    'KeyZ': 90,
    'MetaLeft': 91,
    'MetaRight': 92,
    'ContextMenu': 93,
    'Numpad0': 96,
    'Numpad1': 97,
    'Numpad2': 98,
    'Numpad3': 99,
    'Numpad4': 100,
    'Numpad5': 101,
    'Numpad6': 102,
    'Numpad7': 103,
    'Numpad8': 104,
    'Numpad9': 105,
    'NumpadMultiply': 106,
    'NumpadAdd': 107,
    'NumpadSubtract': 109,
    'NumpadDecimal': 110,
    'NumpadDivide': 111,
    'F1': 112,
    'F2': 113,
    'F3': 114,
    'F4': 115,
    'F5': 116,
    'F6': 117,
    'F7': 118,
    'F8': 119,
    'F9': 120,
    'F10': 121,
    'F11': 122,
    'F12': 123,
    'NumLock': 144,
    'ScrollLock': 145,
    'Semicolon': 186,
    'Equal': 187,
    'Comma': 188,
    'Minus': 189,
    'Period': 190,
    'Slash': 191,
    'Backquote': 192,
    'BracketLeft': 219,
    'Backslash': 220,
    'BracketRight': 221,
    'Quote': 222
  };
  
  return legacyKeyCodes[code] || 0;
}

/**
 * 生成按键的唯一ID
 */
export function generateKeyId(code: string, location?: number): string {
  if (!code) return '';
  
  const locationSuffix = location !== undefined && location !== 0 ? `_${location}` : '';
  return `key_${code}${locationSuffix}`;
}

/**
 * 按键代码标准化
 */
export function normalizeKeyCode(code: string): string {
  if (!code) return '';
  
  // 移除前缀并标准化
  if (code.startsWith('Key')) {
    return code.substring(3);
  }
  
  if (code.startsWith('Digit')) {
    return code.substring(5);
  }
  
  if (code.startsWith('Numpad')) {
    return code.substring(6);
  }
  
  return code;
}

/**
 * 检查两个按键是否相同（考虑位置）
 */
export function areKeysEqual(code1: string, code2: string, location1?: number, location2?: number): boolean {
  if (code1 !== code2) return false;
  
  // 如果位置都未定义，认为相同
  if (location1 === undefined && location2 === undefined) return true;
  
  // 如果只有一个位置未定义，认为不同
  if (location1 === undefined || location2 === undefined) return false;
  
  return location1 === location2;
}