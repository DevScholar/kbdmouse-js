/**
 * 状态管理器模块
 * 管理虚拟键盘的状态，包括修饰键状态、切换键状态等
 */

import type { StateManager, ModifierStates, KeyState } from '../types/core.js';

/**
 * 创建状态管理器实例
 */
export function createStateManager(): StateManager {
  const modifierStates: ModifierStates = {
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
    capsLock: false,
    numLock: false,
    hasOtherModifiers: false
  };

  const keyStates = new Map<string, KeyState>();
  const toggleStates = new Map<string, boolean>();
  const activeKeys = new Set<string>();

  const keyDownKeys: HTMLElement[] = [];
  const keyDownModifiers = new Set<string>();

  const keyRepeatConfig = {
    repeatTimer: null as number | null,
    repeatInterval: 50,
    repeatDelay: 500,
    isRepeating: false,
    repeatKey: null as HTMLElement | null
  };

  // 重置切换键状态
  const resetToggleStates = () => {
    toggleStates.clear();
  };

  // 开始重复按键
  const startRepeat = (vkKey: HTMLElement) => {
    // 停止之前的重复
    stopRepeat();
    
    const code = vkKey.getAttribute('code');
    if (!code) return;

    // 设置重复状态
    keyRepeatConfig.repeatKey = vkKey;
    keyRepeatConfig.isRepeating = true;

    // 延迟后开始重复
    keyRepeatConfig.repeatTimer = window.setTimeout(() => {
      if (keyRepeatConfig.repeatKey === vkKey) {
        const repeatInterval = () => {
          if (keyRepeatConfig.repeatKey === vkKey && keyRepeatConfig.isRepeating) {
            // 触发按键重复事件
            const event = new CustomEvent('keyrepeat', { detail: { vkKey, code } });
            vkKey.dispatchEvent(event);
            keyRepeatConfig.repeatTimer = window.setInterval(repeatInterval, keyRepeatConfig.repeatInterval);
          }
        };
        repeatInterval();
      }
    }, keyRepeatConfig.repeatDelay);
  };

  // 停止重复按键
  const stopRepeat = () => {
    if (keyRepeatConfig.repeatTimer) {
      window.clearTimeout(keyRepeatConfig.repeatTimer);
      window.clearInterval(keyRepeatConfig.repeatTimer);
      keyRepeatConfig.repeatTimer = null;
    }
    keyRepeatConfig.isRepeating = false;
    keyRepeatConfig.repeatKey = null;
  };

  // 重置所有状态
  const resetAllStates = () => {
    keyDownKeys.length = 0;
    keyDownModifiers.clear();
    toggleStates.clear();
    
    // 重置修饰键状态
    modifierStates.shift = false;
    modifierStates.ctrl = false;
    modifierStates.alt = false;
    modifierStates.meta = false;
    modifierStates.capsLock = false;
    modifierStates.numLock = false;
    modifierStates.hasOtherModifiers = false;
    
    // 重置所有按键状态
    keyStates.clear();
    activeKeys.clear();
    
    // 停止重复
    stopRepeat();
  };

  return {
    keyDownKeys,
    keyDownModifiers,
    toggleStates,
    keyRepeatConfig,
    
    // 获取修饰键状态
    getModifierStates: () => ({ ...modifierStates }),

    // 设置修饰键状态
    setModifierState: (key: string, state: boolean) => {
      switch (key) {
        case 'ShiftLeft':
        case 'ShiftRight':
          modifierStates.shift = state;
          break;
        case 'ControlLeft':
        case 'ControlRight':
          modifierStates.ctrl = state;
          break;
        case 'AltLeft':
        case 'AltRight':
          modifierStates.alt = state;
          break;
        case 'MetaLeft':
        case 'MetaRight':
          modifierStates.meta = state;
          break;
        case 'CapsLock':
          modifierStates.capsLock = state;
          break;
        case 'NumLock':
          modifierStates.numLock = state;
          break;
      }

      // 更新hasOtherModifiers状态
      modifierStates.hasOtherModifiers = modifierStates.ctrl || modifierStates.alt || modifierStates.meta;
    },

    // 切换修饰键状态（用于切换键如Caps Lock）
    toggleModifierState: (key: string) => {
      switch (key) {
        case 'CapsLock':
          modifierStates.capsLock = !modifierStates.capsLock;
          return modifierStates.capsLock;
        case 'NumLock':
          modifierStates.numLock = !modifierStates.numLock;
          return modifierStates.numLock;
      }
      return false;
    },

    // 获取按键状态
    getKeyState: (code: string) => {
      return keyStates.get(code) || null;
    },

    // 设置按键状态
    setKeyState: (code: string, state: KeyState) => {
      keyStates.set(code, state);
      
      if (state.isDown) {
        activeKeys.add(code);
      } else {
        activeKeys.delete(code);
      }
    },

    // 移除按键状态
    removeKeyState: (code: string) => {
      keyStates.delete(code);
      activeKeys.delete(code);
    },

    // 获取所有激活的按键
    getActiveKeys: () => {
      return Array.from(activeKeys);
    },

    // 检查按键是否被按下
    isKeyDown: (vkKey: HTMLElement) => {
      const code = vkKey.getAttribute('code');
      if (!code) return false;
      const state = keyStates.get(code);
      return state ? state.isDown : false;
    },

    // 获取切换键状态
    getToggleState: (code: string) => {
      return toggleStates.get(code) || false;
    },

    // 设置切换键状态
    setToggleState: (code: string, state: boolean) => {
      toggleStates.set(code, state);
    },

    // 按键按下状态管理
    addKeyDownKey: (vkKey: HTMLElement) => {
      const code = vkKey.getAttribute('code');
      if (code) {
        keyStates.set(code, { isDown: true, isRepeating: false, timestamp: Date.now() });
        activeKeys.add(code);
      }
    },

    // 按键抬起状态管理
    removeKeyDownKey: (vkKey: HTMLElement) => {
      const code = vkKey.getAttribute('code');
      if (code) {
        keyStates.set(code, { isDown: false, isRepeating: false, timestamp: Date.now() });
        activeKeys.delete(code);
      }
    },

    // 检查按键是否被按下
    isKeyPressed: (code: string) => {
      const state = keyStates.get(code);
      return state ? state.isDown : false;
    },

    // 获取所有按下的按键
    getPressedKeys: () => {
      const pressed: HTMLElement[] = [];
      keyStates.forEach((state, code) => {
        if (state.isDown) {
          // 这里需要获取对应的DOM元素，但当前没有容器引用
          // 暂时返回空数组，后续需要重构
        }
      });
      return pressed;
    },

    // 修饰键管理
    addModifier: (modifier: string) => {
      // 这里需要实现修饰键管理逻辑
      // 暂时留空，后续需要重构
    },

    // 修饰键管理
    removeModifier: (modifier: string) => {
      // 这里需要实现修饰键管理逻辑
      // 暂时留空，后续需要重构
    },

    // 获取按下的修饰键
    getKeyDownModifiers: () => {
      const modifiers: string[] = [];
      if (modifierStates.shift) modifiers.push('Shift');
      if (modifierStates.ctrl) modifiers.push('Control');
      if (modifierStates.alt) modifiers.push('Alt');
      if (modifierStates.meta) modifiers.push('Meta');
      return modifiers;
    },

    // 检查修饰键是否按下
    isModifierKeyDown: (modifier: string) => {
      switch (modifier) {
        case 'Shift': return modifierStates.shift;
        case 'Control': return modifierStates.ctrl;
        case 'Alt': return modifierStates.alt;
        case 'Meta': return modifierStates.meta;
        default: return false;
      }
    },

    // 清空所有按键按下状态
    clearAllKeyDownKeys: () => {
      keyStates.forEach((state, code) => {
        state.isDown = false;
        state.isRepeating = false;
      });
      activeKeys.clear();
    },

    // 重置修饰键状态
    resetModifiers: () => {
      modifierStates.shift = false;
      modifierStates.ctrl = false;
      modifierStates.alt = false;
      modifierStates.meta = false;
      modifierStates.hasOtherModifiers = false;
    },

    // 抬起所有修饰键
    keyUpAllModifiers: () => {
      // 这里需要实现抬起所有修饰键的逻辑
      // 暂时留空，后续需要重构
    },

    // 重置切换键状态
    resetToggleStates,

    // 重置所有状态
    resetAllStates,

    // 开始重复按键
    startRepeat,

    // 停止重复按键
    stopRepeat,

    // 获取当前状态摘要
    getStateSummary: () => {
      const keys: Record<string, KeyState> = {};
      keyStates.forEach((state, code) => {
        keys[code] = state;
      });
      
      return {
        modifiers: { ...modifierStates },
        keys
      };
    }
  };
}

/**
 * 检查是否为切换键
 */
function isToggleKey(code: string): boolean {
  return code === 'CapsLock' || code === 'NumLock';
}