/**
 * 缩放管理器模块
 * 管理虚拟键盘的缩放和尺寸调整
 */

/**
 * 缩放管理器接口
 */
export interface ScalingManager {
  // 应用缩放
  applyScaling(scale: number): void;
  
  // 获取当前缩放
  getCurrentScale(): number;
  
  // 设置基础尺寸
  setBaseDimensions(width: number, height: number): void;
  
  // 获取基础尺寸
  getBaseDimensions(): { width: number; height: number };
  
  // 重置缩放
  resetScaling(): void;
  
  // 启用/禁用缩放
  setScalingEnabled(enabled: boolean): void;
  
  // 检查缩放是否启用
  isScalingEnabled(): boolean;
  
  // 获取最小缩放
  getMinScale(): number;
  
  // 获取最大缩放
  getMaxScale(): number;
  
  // 设置缩放限制
  setScaleLimits(minScale: number, maxScale: number): void;
  
  // 添加缩放变化监听器
  addScaleChangeListener(listener: (scale: number) => void): void;
  
  // 移除缩放变化监听器
  removeScaleChangeListener(listener: (scale: number) => void): void;
}

/**
 * 创建缩放管理器实例
 */
export function createScalingManager(container: HTMLElement): ScalingManager {
  let currentScale = 1.0;
  let baseWidth = 0;
  let baseHeight = 0;
  let scalingEnabled = true;
  let minScale = 0.5;
  let maxScale = 2.0;
  
  const scaleChangeListeners: Array<(scale: number) => void> = [];
  
  // 初始化基础尺寸
  function initializeBaseDimensions() {
    const rect = container.getBoundingClientRect();
    baseWidth = rect.width;
    baseHeight = rect.height;
  }
  
  // 初始化基础尺寸
  initializeBaseDimensions();
  
  // 应用缩放变换
  function applyTransform() {
    if (!scalingEnabled) return;
    
    // 限制缩放范围
    currentScale = Math.max(minScale, Math.min(maxScale, currentScale));
    
    // 应用CSS变换
    container.style.transform = `scale(${currentScale})`;
    container.style.transformOrigin = 'top left';
    
    // 通知监听器
    scaleChangeListeners.forEach(listener => listener(currentScale));
  }
  
  return {
    // 应用缩放
    applyScaling: (scale: number) => {
      currentScale = scale;
      applyTransform();
    },
    
    // 获取当前缩放
    getCurrentScale: () => currentScale,
    
    // 设置基础尺寸
    setBaseDimensions: (width: number, height: number) => {
      baseWidth = width;
      baseHeight = height;
    },
    
    // 获取基础尺寸
    getBaseDimensions: () => ({ width: baseWidth, height: baseHeight }),
    
    // 重置缩放
    resetScaling: () => {
      currentScale = 1.0;
      applyTransform();
    },
    
    // 启用/禁用缩放
    setScalingEnabled: (enabled: boolean) => {
      scalingEnabled = enabled;
      if (!enabled) {
        container.style.transform = '';
        container.style.transformOrigin = '';
      } else {
        applyTransform();
      }
    },
    
    // 检查缩放是否启用
    isScalingEnabled: () => scalingEnabled,
    
    // 获取最小缩放
    getMinScale: () => minScale,
    
    // 获取最大缩放
    getMaxScale: () => maxScale,
    
    // 设置缩放限制
    setScaleLimits: (min: number, max: number) => {
      minScale = min;
      maxScale = max;
      applyTransform(); // 重新应用当前缩放以应用新限制
    },
    
    // 添加缩放变化监听器
    addScaleChangeListener: (listener: (scale: number) => void) => {
      scaleChangeListeners.push(listener);
    },
    
    // 移除缩放变化监听器
    removeScaleChangeListener: (listener: (scale: number) => void) => {
      const index = scaleChangeListeners.indexOf(listener);
      if (index > -1) {
        scaleChangeListeners.splice(index, 1);
      }
    }
  };
}

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
 * 计算按键的最佳尺寸
 */
export function calculateOptimalKeySize(
  containerWidth: number,
  containerHeight: number,
  keyCount: number,
  rows: number,
  padding: number = 10
): { width: number; height: number } {
  // 计算可用空间
  const availableWidth = containerWidth - (padding * 2);
  const availableHeight = containerHeight - (padding * 2);
  
  // 计算每行的按键数
  const keysPerRow = Math.ceil(keyCount / rows);
  
  // 计算按键尺寸
  const keyWidth = Math.floor(availableWidth / keysPerRow);
  const keyHeight = Math.floor(availableHeight / rows);
  
  // 确保按键不会太窄或太矮
  const minWidth = 40;
  const minHeight = 40;
  
  return {
    width: Math.max(keyWidth, minWidth),
    height: Math.max(keyHeight, minHeight)
  };
}

/**
 * 检查尺寸是否适合显示
 */
export function isSizeSuitableForDisplay(width: number, height: number, minWidth: number = 300, minHeight: number = 150): boolean {
  return width >= minWidth && height >= minHeight;
}

/**
 * 获取推荐的缩放级别
 */
export function getRecommendedScale(containerWidth: number, containerHeight: number, targetWidth: number = 800, targetHeight: number = 300): number {
  const widthScale = containerWidth / targetWidth;
  const heightScale = containerHeight / targetHeight;
  
  // 使用较小的缩放比例以确保适配
  return Math.min(widthScale, heightScale);
}

/**
 * 创建尺寸观察器
 */
export function createResizeObserver(callback: (entry: ResizeObserverEntry) => void): ResizeObserver {
  return new ResizeObserver((entries) => {
    entries.forEach(entry => {
      callback(entry);
    });
  });
}