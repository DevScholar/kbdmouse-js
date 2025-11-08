/**
 * 按键管理器模块
 * 管理虚拟键盘的按键，包括按键查找、过滤、映射等功能
 */

import type { KeyManager, VkKeyElement } from '../types/core.js';

/**
 * 创建按键管理器实例
 */
export function createKeyManager(container: HTMLElement): KeyManager {
  const keyManager = {
    // 通过代码查找按键元素
    findByCode: (code: string): VkKeyElement | null => {
      if (!code) return null;
      
      // 查找具有指定code属性的按键元素
      const keyElement = container.querySelector(`vk-key[code="${code}"]`) as VkKeyElement;
      
      // 如果未找到，尝试查找具有data-code属性的元素
      if (!keyElement) {
        return container.querySelector(`vk-key[data-code="${code}"]`) as VkKeyElement;
      }
      
      return keyElement;
    },

    // 通过键值查找按键元素
    findByKey: (key: string): VkKeyElement | null => {
      if (!key) return null;
      
      // 查找具有指定key属性的按键元素
      const keyElement = container.querySelector(`vk-key[key="${key}"]`) as VkKeyElement;
      
      // 如果未找到，尝试查找具有data-key属性的元素
      if (!keyElement) {
        return container.querySelector(`vk-key[data-key="${key}"]`) as VkKeyElement;
      }
      
      return keyElement;
    },

    // 通过位置查找按键元素
    findByLocation: (location: number): VkKeyElement[] => {
      const keys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      
      return Array.from(keys).filter(key => {
        const keyLocation = parseInt(key.getAttribute('location') || '0', 10);
        return keyLocation === location;
      });
    },

    // 获取所有按键元素
    getAllKeys: (): VkKeyElement[] => {
      return Array.from(container.querySelectorAll('vk-key')) as VkKeyElement[];
    },

    // 按键过滤 - 根据条件过滤按键
    filterKeys: (predicate: (key: VkKeyElement) => boolean): VkKeyElement[] => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      return Array.from(allKeys).filter(predicate);
    },

    // 按键映射 - 将按键映射到其他值
    mapKeys: <T>(mapper: (key: VkKeyElement) => T): T[] => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      return Array.from(allKeys).map(mapper);
    },

    // 按键分组 - 按键分组到映射中
    groupKeys: <K>(grouper: (key: VkKeyElement) => K): Map<K, VkKeyElement[]> => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      const groups = new Map<K, VkKeyElement[]>();
      
      Array.from(allKeys).forEach(key => {
        const groupKey = grouper(key);
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(key);
      });
      
      return groups;
    },

    // 按键统计 - 获取按键统计信息
    getKeyStatistics: () => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      const totalKeys = allKeys.length;
      
      let modifierKeys = 0;
      let toggleKeys = 0;
      let normalKeys = 0;
      
      Array.from(allKeys).forEach(key => {
        const code = key.getAttribute('code') || '';
        
        if (isModifierKey(code)) {
          modifierKeys++;
        } else if (isToggleKey(code)) {
          toggleKeys++;
        } else {
          normalKeys++;
        }
      });
      
      return {
        total: totalKeys,
        modifiers: modifierKeys,
        toggles: toggleKeys,
        normal: normalKeys
      };
    },

    // 按键验证 - 验证按键元素
    validateKeys: () => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      const errors: string[] = [];
      
      Array.from(allKeys).forEach((key, index) => {
        const code = key.getAttribute('code');
        const keyAttr = key.getAttribute('key');
        
        if (!code) {
          errors.push(`按键 #${index + 1} 缺少code属性`);
        }
        
        if (!keyAttr) {
          errors.push(`按键 #${index + 1} 缺少key属性`);
        }
        
        // 检查按键是否有正确的标签
        const label = key.textContent?.trim();
        if (!label) {
          errors.push(`按键 #${index + 1} (${code || 'unknown'}) 缺少标签`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    },

    // 按键排序 - 按键按键代码排序
    sortKeysByCode: (): VkKeyElement[] => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      
      return Array.from(allKeys).sort((a, b) => {
        const codeA = a.getAttribute('code') || '';
        const codeB = b.getAttribute('code') || '';
        
        return codeA.localeCompare(codeB);
      });
    },

    // 按键搜索 - 按键代码或键值搜索按键
    searchKeys: (query: string): VkKeyElement[] => {
      if (!query) return [];
      
      const lowerQuery = query.toLowerCase();
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      
      return Array.from(allKeys).filter(key => {
        const code = key.getAttribute('code')?.toLowerCase() || '';
        const keyAttr = key.getAttribute('key')?.toLowerCase() || '';
        const label = key.textContent?.toLowerCase() || '';
        
        return code.includes(lowerQuery) || 
               keyAttr.includes(lowerQuery) || 
               label.includes(lowerQuery);
      });
    },

    // 按键聚焦
    focusKey: (key: HTMLElement) => {
      key.focus();
      key.classList.add('vk-focused');
    },

    // 按键查找 - 按键代码或键值查找按键
    findByCodeOrKey: (codeOrKey: string): VkKeyElement | null => {
      return keyManager.findByCode(codeOrKey) || keyManager.findByKey(codeOrKey);
    },

    // 按键高亮 - 按键代码或键值高亮按键
    highlightKey: (key: VkKeyElement, highlight: boolean = true): void => {
      if (highlight) {
        key.classList.add('highlighted');
      } else {
        key.classList.remove('highlighted');
      }
    },

    // 按键排序 - 按键按键代码排序
    sortKeys: (compareFn?: (a: VkKeyElement, b: VkKeyElement) => number): VkKeyElement[] => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      
      return Array.from(allKeys).sort(compareFn || ((a, b) => {
        const codeA = a.getAttribute('code') || '';
        const codeB = b.getAttribute('code') || '';
        return codeA.localeCompare(codeB);
      }));
    },

    // 按键索引 - 按键索引获取按键
    getKeyByIndex: (index: number): VkKeyElement | null => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      return allKeys[index] || null;
    },

    // 按键索引 - 按键元素获取索引
    getKeyIndex: (key: VkKeyElement): number => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      return Array.from(allKeys).indexOf(key);
    },

    // 按键类型检查 - 检查是否为物理切换键
    isPhysicalToggleKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return isToggleKey(code);
    },

    // 按键类型检查 - 检查是否为修饰键
    isModifierKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return isModifierKey(code);
    },

    // 按键类型检查 - 检查是否为普通键
    isNormalKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return !isModifierKey(code) && !isToggleKey(code);
    },

    // 按键类型检查 - 检查是否为切换键
    isToggleKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return isToggleKey(code);
    },

    // 按键类型检查 - 检查是否为大小写锁定键
    isCapsLockKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return code === 'CapsLock';
    },

    // 按键类型检查 - 检查是否为数字锁定键
    isNumLockKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return code === 'NumLock';
    },

    // 按键类型检查 - 检查是否为主键盘按键
    isMainKeyboardKey: (vkKey: VkKeyElement): boolean => {
      const code = vkKey.getAttribute('code') || '';
      return !code.startsWith('Numpad') && !code.startsWith('Media');
    },

    // 按键获取 - 按键代码获取按键
    getKeyCodes: (): string[] => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      return Array.from(allKeys)
        .map(key => key.getAttribute('code') || '')
        .filter(code => code !== '');
    },

    // 按键获取 - 按键键值获取按键
    getKeyValues: (): string[] => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      return Array.from(allKeys)
        .map(key => key.getAttribute('key') || '')
        .filter(key => key !== '');
    },

    // 按键获取 - 获取修饰键
    getModifierKeys: (): VkKeyElement[] => {
      return keyManager.filterKeys(key => keyManager.isModifierKey(key));
    },

    // 按键获取 - 获取切换键
    getToggleKeys: (): VkKeyElement[] => {
      return keyManager.filterKeys(key => keyManager.isToggleKey(key));
    },

    // 按键获取 - 获取普通键
    getNormalKeys: (): VkKeyElement[] => {
      return keyManager.filterKeys(key => keyManager.isNormalKey(key));
    },

    // 按键分组 - 按键按键类型分组
    getKeyGroups: (): Record<string, VkKeyElement[]> => {
      const allKeys = container.querySelectorAll('vk-key') as NodeListOf<VkKeyElement>;
      const groups: Record<string, VkKeyElement[]> = {
        modifiers: [],
        toggles: [],
        normal: [],
        functions: [],
        numpads: [],
        media: []
      };
      
      Array.from(allKeys).forEach(key => {
        const code = key.getAttribute('code') || '';
        
        if (isModifierKey(code)) {
          groups.modifiers.push(key);
        } else if (isToggleKey(code)) {
          groups.toggles.push(key);
        } else if (isFunctionKey(code)) {
          groups.functions.push(key);
        } else if (isNumpadKey(code)) {
          groups.numpads.push(key);
        } else if (code.startsWith('Media')) {
          groups.media.push(key);
        } else {
          groups.normal.push(key);
        }
      });
      
      return groups;
    },

    // 按键模糊 - 按键元素失去焦点
    blurKey: (key: VkKeyElement): void => {
      key.blur();
    }
  };
  
  return keyManager;
}

/**
 * 检查是否为修饰键
 */
function isModifierKey(code: string): boolean {
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
function isToggleKey(code: string): boolean {
  return !!(code && (code === 'CapsLock' || code === 'NumLock'));
}

/**
 * 检查是否为字母键
 */
function isLetterKey(code: string): boolean {
  return !!(code && code.startsWith('Key'));
}

/**
 * 检查是否为数字键
 */
function isNumberKey(code: string): boolean {
  return !!(code && code.startsWith('Digit'));
}

/**
 * 检查是否为功能键
 */
function isFunctionKey(code: string): boolean {
  return !!(code && code.startsWith('F') && /^F\d+$/.test(code));
}

/**
 * 检查是否为小键盘键
 */
function isNumpadKey(code: string): boolean {
  return !!(code && code.startsWith('Numpad'));
}