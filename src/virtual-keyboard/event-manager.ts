/**
 * 事件管理器模块
 * 管理虚拟键盘的事件处理，包括键盘事件、鼠标事件、焦点事件等
 */

import type { EventManager, VkKeyElement } from '../types/core.js';

/**
 * 创建事件管理器实例
 */
export function createEventManager(container: HTMLElement): EventManager {
  const eventListeners = new Map<string, Set<(event: any) => void>>();
  const keyEventListeners = new Map<string, Map<string, Set<EventListener>>>();
  
  return {
    // 派发按键按下事件
    dispatchKeyDown: (vkKey: HTMLElement) => {
      const code = vkKey.getAttribute('code');
      if (code) {
        // 触发按键按下事件
        const event = new CustomEvent('keydown', { detail: { vkKey, code } });
        vkKey.dispatchEvent(event);
      }
    },

    // 派发按键抬起事件
    dispatchKeyUp: (vkKey: HTMLElement) => {
      const code = vkKey.getAttribute('code');
      if (code) {
        // 触发按键抬起事件
        const event = new CustomEvent('keyup', { detail: { vkKey, code } });
        vkKey.dispatchEvent(event);
      }
    },

    // 派发按键按下事件
    dispatchKeyPress: (vkKey: HTMLElement) => {
      const code = vkKey.getAttribute('code');
      if (code) {
        // 触发按键按下事件
        const event = new CustomEvent('keypress', { detail: { vkKey, code } });
        vkKey.dispatchEvent(event);
      }
    },

    // 处理按键点击
    handleKeyClick: (vkKey: HTMLElement) => {
      // 触发按键点击事件
      const event = new CustomEvent('keyclick', { detail: { vkKey } });
      vkKey.dispatchEvent(event);
    },
    // 添加事件监听器
    addEventListener: (eventType: string, listener: EventListener, options?: AddEventListenerOptions) => {
      if (!eventListeners.has(eventType)) {
        eventListeners.set(eventType, new Set());
      }
      
      eventListeners.get(eventType)!.add(listener);
      
      // 添加到DOM元素
      container.addEventListener(eventType, listener, options);
    },

    // 移除事件监听器
    removeEventListener: (eventType: string, listener: EventListener) => {
      const listeners = eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        
        // 如果该事件类型没有监听器了，删除它
        if (listeners.size === 0) {
          eventListeners.delete(eventType);
        }
        
        // 从DOM元素移除
        container.removeEventListener(eventType, listener);
      }
    },



    // 触发事件
    dispatchEvent: (eventType: string, data?: any) => {
      const listeners = eventListeners.get(eventType);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        });
      }
    },

    // 触发按键事件
    dispatchKeyEvent: (code: string, eventType: string, detail?: any) => {
      const keyListeners = keyEventListeners.get(code);
      if (keyListeners) {
        const listeners = keyListeners.get(eventType);
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener(detail);
            } catch (error) {
              console.error('Error in key event listener:', error);
            }
          });
        }
      }
    },







    // 设置键盘事件监听器
    setupKeyboardEventListeners: (handlers: {
      onKeyDown: (vkKey: HTMLElement) => void;
      onKeyUp: (vkKey: HTMLElement) => void;
      onKeyClick: (vkKey: HTMLElement) => void;
    }) => {
      // 这里需要实现将虚拟按键的点击事件转换为键盘事件
      // 暂时使用代理模式来适配不同的参数类型
      const keyDownHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target && target.hasAttribute('code')) {
          handlers.onKeyDown(target);
        }
      };
      
      const keyUpHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target && target.hasAttribute('code')) {
          handlers.onKeyUp(target);
        }
      };
      
      const keyClickHandler = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target && target.hasAttribute('code')) {
          handlers.onKeyClick(target);
        }
      };
      
      container.addEventListener('mousedown', keyDownHandler);
      container.addEventListener('mouseup', keyUpHandler);
      container.addEventListener('click', keyClickHandler);
    },

    // 清理事件监听器
    cleanupEventListeners: () => {
      // 清理通用事件监听器
      eventListeners.forEach((listeners, eventType) => {
        listeners.forEach(listener => {
          container.removeEventListener(eventType, listener);
        });
      });
      
      // 清理按键事件监听器
      keyEventListeners.forEach((codeListeners, code) => {
        const keyElement = container.querySelector(`vk-key[code="${code}"]`) as VkKeyElement;
        if (keyElement) {
          codeListeners.forEach((listeners, eventType) => {
            listeners.forEach(listener => {
              keyElement.removeEventListener(eventType, listener);
            });
          });
        }
      });
      
      // 清空监听器映射
      eventListeners.clear();
      keyEventListeners.clear();
    },

    // 初始化焦点管理
    initializeFocusManagement: () => {
      // 设置容器的tabindex以使其可聚焦
      if (!container.hasAttribute('tabindex')) {
        container.setAttribute('tabindex', '0');
      }
      
      // 设置ARIA属性
      container.setAttribute('role', 'application');
      container.setAttribute('aria-label', '虚拟键盘');
    },

    // 设置焦点事件监听器
    setupFocusListeners: (handlers: {
      onFocus?: (event: FocusEvent) => void;
      onBlur?: (event: FocusEvent) => void;
      onFocusIn?: (event: FocusEvent) => void;
      onFocusOut?: (event: FocusEvent) => void;
    }) => {
      if (handlers.onFocus) {
        container.addEventListener('focus', handlers.onFocus);
      }
      
      if (handlers.onBlur) {
        container.addEventListener('blur', handlers.onBlur);
      }
      
      if (handlers.onFocusIn) {
        container.addEventListener('focusin', handlers.onFocusIn);
      }
      
      if (handlers.onFocusOut) {
        container.addEventListener('focusout', handlers.onFocusOut);
      }
    },

    // 设置鼠标事件监听器
    setupMouseListeners: (handlers: {
      onClick?: (event: MouseEvent) => void;
      onMouseDown?: (event: MouseEvent) => void;
      onMouseUp?: (event: MouseEvent) => void;
      onMouseEnter?: (event: MouseEvent) => void;
      onMouseLeave?: (event: MouseEvent) => void;
    }) => {
      if (handlers.onClick) {
        container.addEventListener('click', handlers.onClick);
      }
      
      if (handlers.onMouseDown) {
        container.addEventListener('mousedown', handlers.onMouseDown);
      }
      
      if (handlers.onMouseUp) {
        container.addEventListener('mouseup', handlers.onMouseUp);
      }
      
      if (handlers.onMouseEnter) {
        container.addEventListener('mouseenter', handlers.onMouseEnter);
      }
      
      if (handlers.onMouseLeave) {
        container.addEventListener('mouseleave', handlers.onMouseLeave);
      }
    },

    // 设置触摸事件监听器
    setupTouchListeners: (handlers: {
      onTouchStart?: (event: TouchEvent) => void;
      onTouchEnd?: (event: TouchEvent) => void;
      onTouchMove?: (event: TouchEvent) => void;
      onTouchCancel?: (event: TouchEvent) => void;
    }) => {
      if (handlers.onTouchStart) {
        container.addEventListener('touchstart', handlers.onTouchStart);
      }
      
      if (handlers.onTouchEnd) {
        container.addEventListener('touchend', handlers.onTouchEnd);
      }
      
      if (handlers.onTouchMove) {
        container.addEventListener('touchmove', handlers.onTouchMove);
      }
      
      if (handlers.onTouchCancel) {
        container.addEventListener('touchcancel', handlers.onTouchCancel);
      }
    },

    // 获取按键的键盘事件信息
    getKeyboardEventInfo: (event: KeyboardEvent) => {
      return {
        code: event.code,
        key: event.key,
        location: event.location,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        repeat: event.repeat,
        isComposing: event.isComposing,
        charCode: event.charCode,
        keyCode: event.keyCode,
        which: event.which
      };
    },

    // 获取传统键码
    getLegacyKeyCode: (code: string): number => {
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
    },

    // 获取键位置
    getKeyLocation: (code: string): number => {
      if (code.endsWith('Left')) return 1;
      if (code.endsWith('Right')) return 2;
      if (code.startsWith('Numpad')) return 3;
      return 0;
    },

    // 清理资源
    cleanup: () => {
      // 清理事件监听器
      eventListeners.forEach((listeners, eventType) => {
        listeners.forEach(listener => {
          container.removeEventListener(eventType, listener);
        });
      });
      
      // 清理按键事件监听器
      keyEventListeners.forEach((codeListeners, code) => {
        const keyElement = container.querySelector(`vk-key[code="${code}"]`) as VkKeyElement;
        if (keyElement) {
          codeListeners.forEach((listeners, eventType) => {
            listeners.forEach(listener => {
              keyElement.removeEventListener(eventType, listener);
            });
          });
        }
      });
      
      // 清空监听器映射
      eventListeners.clear();
      keyEventListeners.clear();
    }
  };
}