/**
 * 视觉管理器模块
 * 处理虚拟键盘的视觉状态和效果
 */

import type { VisualManager } from '../types/core.js';

/**
 * 创建视觉管理器实例
 */
export function createVisualManager(container: HTMLElement): VisualManager {
  return {
    // 应用按键按下视觉效果
    applyKeyDownEffect: (vkKey: HTMLElement) => {
      if (vkKey) {
        vkKey.classList.add('key-down');
        vkKey.setAttribute('aria-pressed', 'true');
        
        // 处理Shift键按下 - 为字母和数字键添加shift类
        if (isModifierKey(vkKey) && vkKey.getAttribute('code')?.startsWith('Shift')) {
          applyShiftVisualEffect(container, true);
        }
      }
    },

    // 移除按键释放视觉效果
    applyKeyUpEffect: (vkKey: HTMLElement) => {
      if (!vkKey) return;
      
      // 物理切换键（Caps Lock, Num Lock）保持切换状态显示
      if (isPhysicalToggleKey(vkKey)) {
        const code = vkKey.getAttribute('code') || '';
        const toggleState = getToggleState(container, code);
        
        // 更新aria-pressed状态为切换状态
        vkKey.setAttribute('aria-pressed', toggleState ? 'true' : 'false');
        
        // 如果切换状态为激活状态，保持key-down类
        if (!toggleState) {
          vkKey.classList.remove('key-down');
        }
      }
      // 修饰键（Shift, Ctrl, Alt, Meta）保持切换状态
      else if (isModifierKey(vkKey)) {
        // 检查修饰键是否仍被按下（切换状态）
        const isToggleActive = isKeyDown(container, vkKey);
        
        // 更新aria-pressed状态
        vkKey.setAttribute('aria-pressed', isToggleActive ? 'true' : 'false');
        
        // 如果修饰键不再被按下，移除key-down类
        if (!isToggleActive) {
          vkKey.classList.remove('key-down');
        }
      } else {
        // 对于普通键，总是移除key-down并设置aria-pressed为false
        vkKey.classList.remove('key-down');
        vkKey.setAttribute('aria-pressed', 'false');
      }
      
      // 处理Shift键释放 - 从字母和数字键移除shift类
      if (isModifierKey(vkKey) && vkKey.getAttribute('code')?.startsWith('Shift')) {
        // 仅当没有其他Shift键被按下时，才移除shift类
        const modifiers = getModifierStates(container);
        if (!modifiers.shift) {
          applyShiftVisualEffect(container, false);
        }
      }
      
      // 处理Caps Lock键释放 - 从字母键移除caps-lock类
      if (isCapsLockKey(vkKey)) {
        // 仅当Caps Lock未激活时，才移除caps-lock类
        const modifiers = getModifierStates(container);
        if (!modifiers.capsLock) {
          applyCapsLockVisualEffect(container, false);
        }
      }
      
      // 处理Num Lock键释放 - 从小键盘键移除num-lock类
      if (isNumLockKey(vkKey)) {
        // 仅当Num Lock未激活时，才移除num-lock类
        const modifiers = getModifierStates(container);
        if (!modifiers.numLock) {
          applyNumLockVisualEffect(container, false);
        }
      }
    },
    
    // 应用或移除shift视觉效果到字母和数字键
    applyShiftVisualEffect: (apply: boolean) => {
      applyShiftVisualEffect(container, apply);
    },
    
    // 应用或移除caps-lock视觉效果到字母键
    applyCapsLockVisualEffect: (apply: boolean) => {
      applyCapsLockVisualEffect(container, apply);
    },

    // 应用或移除num-lock视觉效果到小键盘键
    applyNumLockVisualEffect: (apply: boolean) => {
      applyNumLockVisualEffect(container, apply);
    },

    // 按键按下时应用视觉效果
    applyKeyDownVisualEffect: (vkKey: HTMLElement) => {
      if (vkKey) {
        vkKey.classList.add('key-down');
      }
    },

    // 按键释放时移除视觉效果
    applyKeyUpVisualEffect: (vkKey: HTMLElement) => {
      if (vkKey) {
        vkKey.classList.remove('key-down');
      }
    },

    // 切换按键的视觉状态（用于切换键如Caps Lock）
    toggleKeyState: (vkKey: HTMLElement, state: boolean) => {
      if (vkKey) {
        if (state) {
          vkKey.classList.add('key-active');
        } else {
          vkKey.classList.remove('key-active');
        }
      }
    },

    // 为按键添加自定义CSS类
    addKeyClass: (vkKey: HTMLElement, className: string) => {
      if (vkKey) {
        vkKey.classList.add(className);
      }
    },

    // 从按键移除自定义CSS类
    removeKeyClass: (vkKey: HTMLElement, className: string) => {
      if (vkKey) {
        vkKey.classList.remove(className);
      }
    }
  };
}

/**
 * 应用或移除shift视觉效果到字母和数字键
 */
function applyShiftVisualEffect(container: HTMLElement, apply: boolean): void {
  const letterKeys = container.querySelectorAll('vk-key[code^="Key"]') as NodeListOf<HTMLElement>;
  const numberKeys = container.querySelectorAll('vk-key[code^="Digit"]') as NodeListOf<HTMLElement>;
  
  [...letterKeys, ...numberKeys].forEach(key => {
    if (apply) {
      key.classList.add('shift');
    } else {
      key.classList.remove('shift');
    }
  });
}

/**
 * 应用或移除caps-lock视觉效果到字母键
 */
function applyCapsLockVisualEffect(container: HTMLElement, apply: boolean): void {
  const letterKeys = container.querySelectorAll('vk-key[code^="Key"]') as NodeListOf<HTMLElement>;
  
  letterKeys.forEach(key => {
    if (apply) {
      key.classList.add('caps-lock');
    } else {
      key.classList.remove('caps-lock');
    }
  });
}

/**
 * 应用或移除num-lock视觉效果到小键盘键
 */
function applyNumLockVisualEffect(container: HTMLElement, apply: boolean): void {
  const numpadKeys = container.querySelectorAll('vk-key[code^="Numpad"]') as NodeListOf<HTMLElement>;
  
  numpadKeys.forEach(key => {
    if (apply) {
      key.classList.add('num-lock');
    } else {
      key.classList.remove('num-lock');
    }
  });
}

/**
 * 检查是否为物理切换键
 */
function isPhysicalToggleKey(vkKey: HTMLElement): boolean {
  const code = vkKey.getAttribute('code') || '';
  return code === 'CapsLock' || code === 'NumLock';
}

/**
 * 检查是否为修饰键
 */
function isModifierKey(vkKey: HTMLElement): boolean {
  const code = vkKey.getAttribute('code') || '';
  return !!(code && (
    code.startsWith('Shift') || 
    code.startsWith('Control') || 
    code.startsWith('Alt') || 
    code.startsWith('Meta')
  ));
}

/**
 * 检查是否为Caps Lock键
 */
function isCapsLockKey(vkKey: HTMLElement): boolean {
  const code = vkKey.getAttribute('code') || '';
  return code === 'CapsLock';
}

/**
 * 检查是否为Num Lock键
 */
function isNumLockKey(vkKey: HTMLElement): boolean {
  const code = vkKey.getAttribute('code') || '';
  return code === 'NumLock';
}

/**
 * 检查按键是否被按下（从容器状态获取）
 */
function isKeyDown(container: HTMLElement, vkKey: HTMLElement): boolean {
  // 这里需要从容器的状态管理器获取，暂时返回false
  // 实际使用时需要传入状态管理器实例
  return false;
}

/**
 * 获取切换状态（从容器状态获取）
 */
function getToggleState(container: HTMLElement, code: string): boolean {
  // 这里需要从容器的状态管理器获取，暂时返回false
  // 实际使用时需要传入状态管理器实例
  return false;
}

/**
 * 获取修饰键状态（从容器状态获取）
 */
function getModifierStates(container: HTMLElement): any {
  // 这里需要从容器的状态管理器获取，暂时返回空对象
  // 实际使用时需要传入状态管理器实例
  return {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
    capsLock: false,
    numLock: false,
    hasOtherModifiers: false
  };
}