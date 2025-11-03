/**
 * Mouse Polyfill for Touch Devices
 * Converts touch events to mouse events for specific elements
 */

import { Logger, globalLogger } from '../logger';

// Debug configuration for console logging
interface DebugConfig {
  enabled: boolean;
  logFunction: (message: string) => void;
}

interface TouchState {
  startTime: number;
  startX: number;
  startY: number;
  currentMode: 'pending' | 'move' | 'drag' | 'rightclick';
  timers: {
    dragTimer?: number;
    rightClickTimer?: number;
    vibrateTimer?: number;
  };
  isMouseDown: boolean;
  targetElement: Element | null;
  hasMoved: boolean;
  clickCount: number;
  lastClickTime: number;
  hasVibrated: boolean;
  previousPosition?: { x: number; y: number; time: number };
  lastDispatchTime?: number;
  lastEventType?: string;
}

interface PolyfillElement {
  element: Element;
  touchStartHandler: (event: TouchEvent) => void;
  touchMoveHandler: (event: TouchEvent) => void;
  touchEndHandler: (event: TouchEvent) => void;
  touchCancelHandler: (event: TouchEvent) => void;
}

class MousePolyfill {
  private polyfillElements = new Map<Element, PolyfillElement>();
  private isTouchDevice: boolean;
  private touchStates = new Map<number, TouchState>(); // touch identifier -> state
  private readonly DRAG_THRESHOLD_TIME = 400; // ms
  private readonly RIGHT_CLICK_THRESHOLD_TIME = 800; // ms
  private readonly MOVE_THRESHOLD_DISTANCE = 10; // pixels
  private readonly DOUBLE_CLICK_WINDOW = 500; // ms - double click detection time window
  private readonly DOUBLE_CLICK_DISTANCE_THRESHOLD = 10; // pixels - coordinate difference threshold
  private readonly SINGLE_CLICK_DELAY = 250; // ms
  private readonly VIBRATE_THRESHOLD_TIME = 500; // ms - time threshold to trigger vibration
  private readonly VIBRATE_DURATION = 30; // ms - vibration duration
  private _debugEnabled = false;
  private _vibrateEnabled = true;
  private logger: Logger;

  // Unified event log listener - handles MouseEvent, TouchEvent, and PointerEvent
  private unifiedLogListener = (event: Event) => {
    // Only log if event type is in our configuration
    if (!this.logEventTypes.has(event.type)) {
      return;
    }

    let eventType = '';
    let x = 0;
    let y = 0;
    let button: number | undefined;
    let buttons: number | undefined;
    let source: 'physical' | 'virtual' = 'physical';
    let pointerType: string | undefined;
    let pointerId: number | undefined;
    
    if (event instanceof PointerEvent) {
      eventType = event.type;
      x = event.clientX;
      y = event.clientY;
      button = event.button;
      buttons = event.buttons;
      pointerType = event.pointerType;
      pointerId = event.pointerId;
      source = (event as any).isVirtualMouse ? 'virtual' : 'physical';
    } else if (event instanceof MouseEvent) {
      eventType = event.type;
      x = event.clientX;
      y = event.clientY;
      button = event.button;
      buttons = event.buttons;
      source = (event as any).isVirtualMouse ? 'virtual' : 'physical';
    } else if (event instanceof TouchEvent) {
      eventType = event.type;
      if (event.touches.length > 0) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      } else if (event.changedTouches.length > 0) {
        x = event.changedTouches[0].clientX;
        y = event.changedTouches[0].clientY;
      }
      source = 'physical'; // Touch events are always physical
    }
    
    // Log the event using the debug format
    this.debug.logMouseEvent(eventType, x, y, button, buttons, source, pointerType, pointerId);
  };

  // Track if mouse log listener is enabled
  private mouseLogListenerEnabled = false;
  
  // Configuration for which event types to log
  private logEventTypes = new Set<string>([
    // Mouse events
    'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'contextmenu',
    // Touch events  
    'touchstart', 'touchend', 'touchmove',
    // Pointer events
    'pointerdown', 'pointerup', 'pointermove', 'pointerenter', 'pointerleave', 'pointercancel'
  ]);

  // Debug sub-object - provides interface to logger while maintaining backward compatibility
  debug = {
    enabled: false,
    logFunction: (message: string) => this.logger.log(message),
    
    // Set custom log function - delegates to logger
    setLogFunction: (fn: (message: string) => void) => {
      this.logger.setLogFunction(fn);
      // Keep debug enabled when setting custom log function
      this.debug.enabled = true;
      this._debugEnabled = true;
    },
    
    // Log method that delegates to logger
    log: (message: string) => {
      this.logger.log(message);
    },
    
    // Format timestamp - delegates to logger
    formatTimestamp: (): string => {
      return this.logger.formatTimestamp();
    },
    
    // Log mouse/touch event - delegates to logger
    logMouseEvent: (eventType: string, x: number, y: number, button?: number, buttons?: number, source: 'physical' | 'virtual' = 'virtual', pointerType?: string, pointerId?: number) => {
      this.logger.logMouseEvent(eventType, x, y, button, buttons, source, pointerType, pointerId);
    }
  };

  private log(message: string, ...args: any[]): void {
    const formattedMessage = `[MousePolyfill] ${message}`;
    if (args.length > 0) {
      this.logger.log(`${formattedMessage} ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
    } else {
      this.logger.log(formattedMessage);
    }
  }

  // Static method to control console output (deprecated - use debug sub-object instead)
  static setConsoleOutput(enabled: boolean): void {
    // This method is kept for backward compatibility but is deprecated
    // Use the debug sub-object instead: mousePolyfill.debug.setLogFunction(fn)
  }

  private lastGlobalClickTime = 0;
  private lastGlobalClickPosition = { x: 0, y: 0 };
  private lastClickInfo: { time: number; x: number; y: number } | null = null;

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Initialize logger
    this.logger = new Logger({ enabled: false });
    
    // Sync debug object with logger
    this.debug.enabled = this.logger.enabled;
    
    // Expose static method to global scope for demo page
    (window as any).MousePolyfill = MousePolyfill;
  }



  /**
   * Get current debug state
   */
  isDebugEnabled(): boolean {
    return this._debugEnabled;
  }

  /**
   * Get current logging element
   */
  get currentLoggingElement(): HTMLElement | null {
    return this.logger.currentLoggingElement;
  }

  /**
   * Set current logging element
   */
  set currentLoggingElement(element: HTMLElement | null) {
    this.logger.currentLoggingElement = element;
  }

  /**
   * Start logging
   */
  startLogging(): void {
    this.logger.start();
  }

  /**
   * Stop logging
   */
  stopLogging(): void {
    this.logger.stop();
  }

  /**
   * Get logger instance (for advanced usage)
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get current modifier key states from virtual keyboard
   * @returns Modifier key states object containing the four modifier keys
   */
  private getModifierStates(): {
    ctrl: boolean;
    alt: boolean;
    shift: boolean;
    meta: boolean;
  } {
    // Try to get modifier states from the first prefab-virtual-keyboard element
    const prefabKeyboard = document.querySelector('prefab-virtual-keyboard') as any;
    if (prefabKeyboard && prefabKeyboard.getModifierStates) {
      const states = prefabKeyboard.getModifierStates();
      return {
        ctrl: states.ctrl || false,
        alt: states.alt || false,
        shift: states.shift || false,
        meta: states.meta || false
      };
    }

    // Fallback: try to get from virtual-keyboard element
    const virtualKeyboard = document.querySelector('virtual-keyboard') as any;
    if (virtualKeyboard && virtualKeyboard.state && virtualKeyboard.state.getModifierStates) {
      const states = virtualKeyboard.state.getModifierStates();
      return {
        ctrl: states.ctrl || false,
        alt: states.alt || false,
        shift: states.shift || false,
        meta: states.meta || false
      };
    }

    // Default to no modifiers pressed
    return {
      ctrl: false,
      alt: false,
      shift: false,
      meta: false
    };
  }

  /**
   * Create enhanced mouse event with all missing properties
   */
  private createEnhancedMouseEvent(
    type: string,
    touch: Touch,
    button: number,
    buttons: number,
    targetElement: Element | null,
    touchState: TouchState,
    options: {
      bubbles?: boolean;
      cancelable?: boolean;
      detail?: number;
      relatedTarget?: Element | null;
      composed?: boolean;
      view?: Window;
    } = {}
  ): MouseEvent {
    const modifiers = this.getModifierStates();
    const currentTime = performance.now();
    
    // Calculate enhanced properties
    const pageX = touch.clientX + window.scrollX;
    const pageY = touch.clientY + window.scrollY;
    const screenX = touch.screenX;
    const screenY = touch.screenY;
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    const x = clientX;
    const y = clientY;
    
    // Calculate movement (if we have previous position)
    let movementX = 0;
    let movementY = 0;
    if (touchState.previousPosition && touchState.lastDispatchTime) {
      const timeDelta = currentTime - touchState.lastDispatchTime;
      if (timeDelta > 0 && timeDelta < 1000) { // 合理的移动时间窗口
        movementX = clientX - touchState.previousPosition.x;
        movementY = clientY - touchState.previousPosition.y;
      }
    }
    
    // Calculate offset if we have target element
    let offsetX = 0;
    let offsetY = 0;
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
    }
    
    // Calculate layerX/layerY - similar to offsetX/Y but consider element positioning
    let layerX = offsetX;
    let layerY = offsetY;
    if (targetElement) {
      const computedStyle = window.getComputedStyle(targetElement);
      const isPositioned = computedStyle.position === 'relative' || 
                          computedStyle.position === 'absolute' || 
                          computedStyle.position === 'fixed';
      
      if (!isPositioned) {
        // If element is not positioned, layerX/Y should be relative to document
        layerX = pageX;
        layerY = pageY;
      }
      // If positioned, layerX/Y is same as offsetX/Y (relative to element's border box)
    }
    
    // Pointer properties
    const pointerId = touch.identifier + 1000; // 避免与真实指针ID冲突
    const pointerType = 'mouse';
    const width = 1;  // 鼠标接触面小
    const height = 1;
    const pressure = buttons > 0 ? 1 : 0;
    const tiltX = 0;
    const tiltY = 0;
    const twist = 0;
    
    // Create base mouse event
    const mouseEvent = new MouseEvent(type, {
      bubbles: options.bubbles !== false,
      cancelable: options.cancelable !== false,
      composed: options.composed ?? true,
      view: options.view ?? window,
      detail: options.detail ?? (type === 'click' || type === 'dblclick' ? 1 : 0),
      screenX,
      screenY,
      clientX,
      clientY,
      button,
      buttons,
      relatedTarget: options.relatedTarget ?? null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    
    // Add enhanced properties using Object.defineProperty for better兼容性
    const enhancedEvent = mouseEvent as any;
    
    // Enhanced coordinate properties
    Object.defineProperty(enhancedEvent, 'pageX', { value: pageX, writable: false });
    Object.defineProperty(enhancedEvent, 'pageY', { value: pageY, writable: false });
    Object.defineProperty(enhancedEvent, 'x', { value: x, writable: false });
    Object.defineProperty(enhancedEvent, 'y', { value: y, writable: false });
    Object.defineProperty(enhancedEvent, 'offsetX', { value: offsetX, writable: false });
    Object.defineProperty(enhancedEvent, 'offsetY', { value: offsetY, writable: false });
    Object.defineProperty(enhancedEvent, 'layerX', { value: layerX, writable: false });
    Object.defineProperty(enhancedEvent, 'layerY', { value: layerY, writable: false });
    
    // Movement properties
    Object.defineProperty(enhancedEvent, 'movementX', { value: movementX, writable: false });
    Object.defineProperty(enhancedEvent, 'movementY', { value: movementY, writable: false });
    
    // Pointer properties
    Object.defineProperty(enhancedEvent, 'pointerId', { value: pointerId, writable: false });
    Object.defineProperty(enhancedEvent, 'pointerType', { value: pointerType, writable: false });
    Object.defineProperty(enhancedEvent, 'width', { value: width, writable: false });
    Object.defineProperty(enhancedEvent, 'height', { value: height, writable: false });
    Object.defineProperty(enhancedEvent, 'pressure', { value: pressure, writable: false });
    Object.defineProperty(enhancedEvent, 'tiltX', { value: tiltX, writable: false });
    Object.defineProperty(enhancedEvent, 'tiltY', { value: tiltY, writable: false });
    Object.defineProperty(enhancedEvent, 'twist', { value: twist, writable: false });
    
    // Polyfill identifier
    enhancedEvent.isPolyfill = true;
    
    // Update touch state tracking
    touchState.previousPosition = { x: clientX, y: clientY, time: currentTime };
    touchState.lastDispatchTime = currentTime;
    
    return enhancedEvent;
  }

  /**
   * Dispatch event with proper target element and enhanced properties
   * This method ensures event consistency with native mouse events
   */
  private dispatchEventEnhanced(event: Event, targetElement: Element): void {
    // Set proper event properties for consistency
    Object.defineProperty(event, 'target', {
      value: targetElement,
      writable: false,
      configurable: true
    });
    
    // Use native dispatchEvent which handles capture/bubble phases automatically
    targetElement.dispatchEvent(event);
  }

  /**
   * Enable or disable vibration feedback
   * @param enabled Whether to enable vibration
   */
  set vibrate(enabled: boolean) {
    this._vibrateEnabled = enabled;
  }

  get vibrate(): boolean {
    return this._vibrateEnabled;
  }

  /**
   * Get current vibration state
   */
  isVibrateEnabled(): boolean {
    return this._vibrateEnabled;
  }

  /**
   * Enable mouse log listener for the given element
   * @param element The element to attach listeners to
   * @param eventTypes Optional array of specific event types to log. If not provided, logs all configured types
   */
  enableMouseLogListener(element: Element, eventTypes?: string[]): void {
    if (this.mouseLogListenerEnabled) return;
    
    // If specific event types are provided, use them instead of the default set
    if (eventTypes && eventTypes.length > 0) {
      this.logEventTypes.clear();
      eventTypes.forEach(type => this.logEventTypes.add(type));
    }
    
    // Add single unified listener for all event types
    // Use capture phase to ensure we get all events
    this.logEventTypes.forEach(eventType => {
      element.addEventListener(eventType, this.unifiedLogListener, { capture: true });
    });
    
    this.mouseLogListenerEnabled = true;
    const enabledTypes = Array.from(this.logEventTypes).join(', ');
    this.log(`Mouse log listener enabled for events: ${enabledTypes}`);
  }

  /**
   * Disable mouse log listener
   * @param element The element to remove listeners from
   */
  disableMouseLogListener(element: Element): void {
    if (!this.mouseLogListenerEnabled) return;
    
    // Remove the unified listener for all event types
    this.logEventTypes.forEach(eventType => {
      element.removeEventListener(eventType, this.unifiedLogListener, { capture: true });
    });
    
    this.mouseLogListenerEnabled = false;
    this.log('Mouse log listener disabled');
  }

  /**
   * Configure which event types to log
   * @param eventTypes Array of event types to log
   */
  setLogEventTypes(eventTypes: string[]): void {
    this.logEventTypes.clear();
    eventTypes.forEach(type => this.logEventTypes.add(type));
    
    if (this._debugEnabled) {
      this.debug.log(`[MousePolyfill] Configured to log events: ${eventTypes.join(', ')}`);
    }
  }

  /**
   * Get currently configured event types for logging
   */
  getLogEventTypes(): string[] {
    return Array.from(this.logEventTypes);
  }

  /**
   * Add polyfill for a specific element
   * @param element The element to add polyfill for
   */
  addPolyfillFor(element: Element): void {
    // Allow polyfill on all devices for debugging purposes
    // On desktop, it will only log events but not interfere with normal mouse behavior

    if (this.polyfillElements.has(element)) {
      // Already has polyfill
      return;
    }

    const polyfillElement: PolyfillElement = {
      element,
      touchStartHandler: this.createTouchStartHandler(element),
      touchMoveHandler: this.createTouchMoveHandler(element),
      touchEndHandler: this.createTouchEndHandler(element),
      touchCancelHandler: this.createTouchCancelHandler(element)
    };

    // Add touch event listeners
    (element as any).addEventListener('touchstart', polyfillElement.touchStartHandler, { passive: false });
    (element as any).addEventListener('touchmove', polyfillElement.touchMoveHandler, { passive: false });
    (element as any).addEventListener('touchend', polyfillElement.touchEndHandler, { passive: false });
    (element as any).addEventListener('touchcancel', polyfillElement.touchCancelHandler, { passive: false });

    this.polyfillElements.set(element, polyfillElement);
  }



  /**
   * Check if element has polyfill
   * @param element The element to check
   */
  hasPolyfillFor(element: Element): boolean {
    return this.polyfillElements.has(element);
  }

  /**
   * Remove polyfill from a specific element
   * @param element The element to remove polyfill from
   */
  removePolyfillFor(element: Element): void {
    const polyfillElement = this.polyfillElements.get(element);
    if (!polyfillElement) {
      // No polyfill to remove
      return;
    }

    // Remove touch event listeners
    (element as any).removeEventListener('touchstart', polyfillElement.touchStartHandler);
    (element as any).removeEventListener('touchmove', polyfillElement.touchMoveHandler);
    (element as any).removeEventListener('touchend', polyfillElement.touchEndHandler);
    (element as any).removeEventListener('touchcancel', polyfillElement.touchCancelHandler);

    // Clean up any remaining touch states for this element
    for (const [touchId, touchState] of this.touchStates.entries()) {
      if (touchState.targetElement === element) {
        this.clearTouchTimers(touchState);
        this.touchStates.delete(touchId);
      }
    }

    // Remove from polyfill elements map
    this.polyfillElements.delete(element);
    
    if (this._debugEnabled) {
      this.debug.log(`[MousePolyfill] Removed polyfill from element ${element.tagName} ${element.id || element.className}`);
    }
  }

  /**
   * Calculate distance between two points
   */
  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Clear all timers for a touch state
   */
  private clearTouchTimers(touchState: TouchState): void {
    if (touchState.timers.dragTimer) {
      clearTimeout(touchState.timers.dragTimer);
      touchState.timers.dragTimer = undefined;
    }
    if (touchState.timers.rightClickTimer) {
      clearTimeout(touchState.timers.rightClickTimer);
      touchState.timers.rightClickTimer = undefined;
    }
    if (touchState.timers.vibrateTimer) {
      clearTimeout(touchState.timers.vibrateTimer);
      touchState.timers.vibrateTimer = undefined;
    }
  }

  /**
   * Schedule vibration for a touch state
   */
  private scheduleVibration(touchState: TouchState, touchId: number): void {
    if (!this._vibrateEnabled || touchState.hasVibrated) {
      return;
    }

    // Set vibration timer - Remove detailed vibration timer logs
    touchState.timers.vibrateTimer = window.setTimeout(() => {
      this.checkAndTriggerVibration(touchId);
    }, this.VIBRATE_THRESHOLD_TIME);
  }

  /**
   * Check conditions and trigger vibration if appropriate
   */
  private checkAndTriggerVibration(touchId: number): void {
    const touchState = this.touchStates.get(touchId);
    if (!touchState || touchState.hasVibrated) {
      return;
    }

    // Check if finger is still touching and not in movement mode
    const isStationary = touchState.currentMode === 'pending' || touchState.currentMode === 'rightclick';
    
    if (isStationary && this._vibrateEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(this.VIBRATE_DURATION);
        touchState.hasVibrated = true;
        // Simplify vibration logs - Only output once in debug mode
        if (this._debugEnabled) {
          this.debug.log(`[Vibration] Touch ${touchId}: triggered ${this.VIBRATE_DURATION}ms`);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        if (this._debugEnabled) {
          this.debug.log(`[MousePolyfill] Vibration error for touch ${touchId}: ${errorObj.message}`);
        }
      }
    }

    // Clean up timer reference
    touchState.timers.vibrateTimer = undefined;
  }





  /**
   * Helper method to dispatch a single click sequence (mousedown -> mouseup -> click)
   * @param isSecondClick Whether this is the second click in a double click (adds dblclick)
   */
  private dispatchClickSequence(touch: Touch, targetElement: Element, clickCount: number, isDoubleClick: boolean = false): void {
    // Get touch state for this touch
    const touchState = this.touchStates.get(touch.identifier);
    if (!touchState) return;

    // mousedown
    const mouseDownEvent = this.createEnhancedMouseEvent(
      'mousedown',
      touch,
      0,
      1,
      targetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: clickCount
      }
    );
    this.dispatchEventEnhanced(mouseDownEvent, targetElement);

    // Add small delay between mousedown and mouseup to simulate real timing
    setTimeout(() => {
      // mouseup
      const mouseUpEvent = this.createEnhancedMouseEvent(
        'mouseup',
        touch,
        0,
        0,
        targetElement,
        touchState,
        {
          bubbles: true,
          cancelable: true,
          detail: clickCount
        }
      );
      this.dispatchEventEnhanced(mouseUpEvent, targetElement);
      
      // Add small delay between mouseup and click
      setTimeout(() => {
        // click
        const clickEvent = this.createEnhancedMouseEvent(
          'click',
          touch,
          0,
          0,
          targetElement,
          touchState,
          {
            bubbles: true,
            cancelable: true,
            detail: clickCount
          }
        );
        this.dispatchEventEnhanced(clickEvent, targetElement);

        // dblclick (only on second click)
        if (isDoubleClick) {
          const doubleClickEvent = this.createEnhancedMouseEvent(
            'dblclick',
            touch,
            0,
            0,
            targetElement,
            touchState,
            {
              bubbles: true,
              cancelable: true,
              detail: 2
            }
          );
          this.dispatchEventEnhanced(doubleClickEvent, targetElement);
        }
      }, 10);
    }, 10);
  }

  /**
   * Handle click detection - new logic: immediately dispatch click, then check for double click
   */
  private handleClickDetection(touch: Touch, touchState: TouchState): void {
    const currentTime = Date.now();
    
    // Immediately dispatch single click sequence
    this.dispatchSingleClickSequence(touch, touchState.targetElement);
    
    // Check if we need to generate additional double click event
    this.checkAndGenerateDoubleClick(touch);
    
    // Clean up the touch state after click is handled
    this.touchStates.delete(touch.identifier);
  }

  /**
   * Check if we need to generate additional double click event based on last click info
   */
  private checkAndGenerateDoubleClick(currentTouch: Touch): void {
    if (this.lastClickInfo) {
      const timeDiff = Date.now() - this.lastClickInfo.time;
      const distance = Math.sqrt(
        Math.pow(currentTouch.clientX - this.lastClickInfo.x, 2) +
        Math.pow(currentTouch.clientY - this.lastClickInfo.y, 2)
      );
      
      console.log(`[${currentTouch.identifier}] Checking for double click: time diff = ${timeDiff}ms, distance = ${distance}px`);
      
      if (timeDiff <= this.DOUBLE_CLICK_WINDOW && distance <= this.DOUBLE_CLICK_DISTANCE_THRESHOLD) {
        console.log(`[${currentTouch.identifier}] Double click detected! Generating additional dblclick event`);
        
        // Get touch state for this touch
        const touchState = this.touchStates.get(currentTouch.identifier);
        if (!touchState) return;
        
        // Use the original target element from touch state
        const targetElement = touchState.targetElement;
        if (!targetElement) return;
        
        // Use enhanced mouse event creation for double click
        const doubleClickEvent = this.createEnhancedMouseEvent(
          'dblclick',
          currentTouch,
          0,
          0,
          targetElement,
          touchState,
          {
            bubbles: true,
            cancelable: true,
            detail: 2
          }
        );
        
        this.dispatchEventEnhanced(doubleClickEvent, targetElement);
      }
    }
    
    // Update last click info with current click
    this.lastClickInfo = {
      time: Date.now(),
      x: currentTouch.clientX,
      y: currentTouch.clientY
    };
  }
  


  /**
   * Check if this touch should trigger double click (called when new touchstart occurs)
   * This method is now only used for logging and early detection based on lastClickInfo
   */
  private checkForDoubleClick(newTouch: Touch): void {
    if (this.lastClickInfo) {
      const distance = Math.sqrt(
        Math.pow(newTouch.clientX - this.lastClickInfo.x, 2) +
        Math.pow(newTouch.clientY - this.lastClickInfo.y, 2)
      );
      
      const timeDiff = Date.now() - this.lastClickInfo.time;
      
      console.log(`[${newTouch.identifier}] Early double click detection at touchstart: distance = ${distance}px, time = ${timeDiff}ms`);
      
      if (distance <= this.DOUBLE_CLICK_DISTANCE_THRESHOLD && timeDiff <= this.DOUBLE_CLICK_WINDOW) {
        console.log(`[${newTouch.identifier}] Potential double click detected early! Will confirm at touchend. Distance = ${distance}px (≤ ${this.DOUBLE_CLICK_DISTANCE_THRESHOLD}px), Time = ${timeDiff}ms (≤ ${this.DOUBLE_CLICK_WINDOW}ms)`);
      } else {
        if (distance > this.DOUBLE_CLICK_DISTANCE_THRESHOLD) {
          console.log(`[${newTouch.identifier}] Distance too large for double click: ${distance}px (> ${this.DOUBLE_CLICK_DISTANCE_THRESHOLD}px)`);
        }
        if (timeDiff > this.DOUBLE_CLICK_WINDOW) {
          console.log(`[${newTouch.identifier}] Time window expired for double click: ${timeDiff}ms (> ${this.DOUBLE_CLICK_WINDOW}ms)`);
        }
      }
    }
  }

  /**
   * Dispatch complete single click sequence: mousedown -> mouseup -> click
   */
  private dispatchSingleClickSequence(touch: Touch, targetElement: Element | null): void {
    if (!targetElement) return;

    console.log(`[${touch.identifier}] Dispatching single click sequence`);

    // Get touch state for this touch
    const touchState = this.touchStates.get(touch.identifier);
    if (!touchState) return;

    // 1. mousedown
    const mouseDownEvent = this.createEnhancedMouseEvent(
      'mousedown',
      touch,
      0,
      1,
      targetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    targetElement.dispatchEvent(mouseDownEvent);

    // 2. mouseup
    const mouseUpEvent = this.createEnhancedMouseEvent(
      'mouseup',
      touch,
      0,
      0,
      targetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    targetElement.dispatchEvent(mouseUpEvent);

    // 3. click
    const clickEvent = this.createEnhancedMouseEvent(
      'click',
      touch,
      0,
      0,
      targetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    targetElement.dispatchEvent(clickEvent);

    // Update global click tracking
    this.lastGlobalClickTime = Date.now();
    this.lastGlobalClickPosition = { x: touch.clientX, y: touch.clientY };
    
    console.log(`[${touch.identifier}] Single click sequence completed, updated global state: [${touch.clientX}, ${touch.clientY}]`);
  }

  /**
   * Start drag mode
   */
  private startDragMode(touchState: TouchState, touch: Touch): void {
    if (touchState.isMouseDown || touchState.currentMode === 'drag') return;
    
    touchState.currentMode = 'drag';
    touchState.isMouseDown = true;
    
    // Use the original target element from touch state
    const targetElement = touchState.targetElement;
    if (!targetElement) return;
    
    // Use enhanced mouse event creation for drag start
    const mouseEvent = this.createEnhancedMouseEvent(
      'mousedown',
      touch,
      0,
      1,
      targetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );

    this.dispatchEventEnhanced(mouseEvent, targetElement);
  }

  /**
   * Right-click event sequence: mousedown → mouseup → contextmenu
   * Emulates the complete event sequence of physical mouse right-click
   */
  private rightClick(touch: Touch, targetElement: Element): void {
    console.log(`[${touch.identifier}] Triggering right-click sequence`);
    
    // Get touch state for this touch
    const touchState = this.touchStates.get(touch.identifier);
    if (!touchState) return;
    
    // mousedown (button=2, buttons=2)
    const mouseDownEvent = this.createEnhancedMouseEvent(
      'mousedown',
      touch,
      2,
      2,
      targetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    this.dispatchEventEnhanced(mouseDownEvent, targetElement);
    
    // Add small delay between mousedown and mouseup to simulate real timing
    setTimeout(() => {
      // mouseup (button=2, buttons=0)
      const mouseUpEvent = this.createEnhancedMouseEvent(
        'mouseup',
        touch,
        2,
        0,
        targetElement,
        touchState,
        {
          bubbles: true,
          cancelable: true,
          detail: 1
        }
      );
      this.dispatchEventEnhanced(mouseUpEvent, targetElement);
      
      // Add small delay between mouseup and contextmenu
      setTimeout(() => {
        // contextmenu (button=2, buttons=0)
        const contextMenuEvent = this.createEnhancedMouseEvent(
          'contextmenu',
          touch,
          2,
          0,
          targetElement,
          touchState,
          {
            bubbles: true,
            cancelable: true,
            detail: 0
          }
        );
        this.dispatchEventEnhanced(contextMenuEvent, targetElement);
      }, 10);
    }, 10);
  }

  /**
   * Trigger right click mode
   */
  private triggerRightClick(touchState: TouchState, touch: Touch): void {
    if (touchState.currentMode === 'rightclick') return;
    
    touchState.currentMode = 'rightclick';
    
    // Use encapsulated rightClick function
    if (touchState.targetElement) {
      this.rightClick(touch, touchState.targetElement);
    }
  }

  /**
   * Create touch start handler - intelligent touch recognition
   */
  private createTouchStartHandler(element: Element): (event: TouchEvent) => void {
    return (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) return;

      const touchId = touch.identifier;
      const startX = touch.clientX;
      const startY = touch.clientY;
      const startTime = Date.now();

      // Early double-click detection (for logging only)
      this.checkForDoubleClick(touch);

      // Get element at touch position
      const targetElement = document.elementFromPoint(startX, startY);
      
      // Create touch state
      const touchState: TouchState = {
        startTime,
        startX,
        startY,
        currentMode: 'pending',
        timers: {},
        isMouseDown: false,
        targetElement,
        hasMoved: false,
        clickCount: 0,
        lastClickTime: 0,
        hasVibrated: false,
        previousPosition: { x: startX, y: startY, time: startTime },
        lastDispatchTime: startTime,
        lastEventType: 'touchstart'
      };

      // Set drag timer (400ms) - mark entry into drag time window
      touchState.timers.dragTimer = window.setTimeout(() => {
        // At 400ms, if still not moved and mode is still pending, mark can enter drag mode
        if (touchState.currentMode === 'pending') {
          // Don't immediately enter drag mode, but wait for movement to enter
          console.log(`[${touchId}] Drag mode available at ${Date.now() - startTime}ms - waiting for movement`);
        }
      }, this.DRAG_THRESHOLD_TIME);

      // Set right-click timer (800ms) - only trigger right-click if still not moved and not entered drag mode at 800ms
      touchState.timers.rightClickTimer = window.setTimeout(() => {
        const currentTouch = Array.from(event.touches).find(t => t.identifier === touchId);
        if (currentTouch) {
          const distance = this.getDistance(startX, startY, currentTouch.clientX, currentTouch.clientY);
          const elapsedTime = Date.now() - startTime;
          console.log(`[${touchId}] Right-click timer triggered at ${elapsedTime}ms, distance: ${distance}px, mode: ${touchState.currentMode}`);
          // Only trigger right-click if still not moved and mode is still pending at 800ms (i.e., never entered drag mode)
          if (distance <= this.MOVE_THRESHOLD_DISTANCE && touchState.currentMode === 'pending') {
            console.log(`[${touchId}] Triggering right-click mode`);
            this.triggerRightClick(touchState, currentTouch);
          } else {
            console.log(`[${touchId}] Right-click conditions not met - distance: ${distance}, mode: ${touchState.currentMode}`);
          }
        } else {
          console.log(`[${touchId}] Right-click timer: touch not found`);
        }
      }, this.RIGHT_CLICK_THRESHOLD_TIME);

      // Store touch state
      this.touchStates.set(touchId, touchState);

      // Schedule vibration
      this.scheduleVibration(touchState, touchId);
    };
  }

  /**
   * Create touch move handler - intelligent touch recognition
   */
  private createTouchMoveHandler(element: Element): (event: TouchEvent) => void {
    return (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) return;

      const touchId = touch.identifier;
      const touchState = this.touchStates.get(touchId);
      
      if (!touchState) return;

      const currentX = touch.clientX;
      const currentY = touch.clientY;
      const distance = this.getDistance(touchState.startX, touchState.startY, currentX, currentY);
      const currentTime = Date.now();
      
      // Add event timing consistency check
      const timeSinceLastEvent = currentTime - (touchState.lastDispatchTime || 0);
      
      // Check if movement exceeds threshold
      if (distance > this.MOVE_THRESHOLD_DISTANCE) {
        touchState.hasMoved = true;
        
        // Cancel vibration timer if movement is detected
        if (touchState.timers.vibrateTimer) {
          clearTimeout(touchState.timers.vibrateTimer);
          touchState.timers.vibrateTimer = undefined;
          if (this.debug.enabled) {
      console.log(`[${touchId}] Vibration cancelled due to movement`);
    }
        }
        
        // Determine mode based on time and current state
          if (touchState.currentMode === 'pending') {
            const elapsedTime = currentTime - touchState.startTime;
            
            if (this.debug.enabled) {
      console.log(`[${touchId}] Movement detected`, { elapsedTime, distance });
    }
            
            if (elapsedTime <= this.DRAG_THRESHOLD_TIME) {
              // ≤400ms: normal move mode
              touchState.currentMode = 'move';
              this.clearTouchTimers(touchState);
            } else if (elapsedTime <= this.RIGHT_CLICK_THRESHOLD_TIME) {
              // 400-800ms: drag mode
              this.startDragMode(touchState, touch);
              this.clearTouchTimers(touchState); // Clear remaining timers
            } else {
              // >800ms: should not happen because right-click timer should have triggered
              touchState.currentMode = 'move';
              this.clearTouchTimers(touchState);
            }
          }
      }

      // Handle movement based on current mode - removed frequency limit for smooth tracking
      switch (touchState.currentMode) {
        case 'move':
          // Normal mouse movement mode (no button pressed)
          this.dispatchMouseMove(touch, 0, 0, touchState.targetElement);
          touchState.lastEventType = 'mousemove';
          break;
          
        case 'drag':
          // Drag mode (mouse button pressed state)
          this.dispatchMouseMove(touch, 0, 1, touchState.targetElement);
          touchState.lastEventType = 'mousemove';
          break;
          
        case 'rightclick':
          // Right-click mode, don't handle movement but keep right button pressed state
          break;
          
        case 'pending':
          // Still waiting for timer trigger, only update position but don't dispatch events
          break;
      }
    };
  }

  /**
   * Dispatch mouse move event
   */
  private dispatchMouseMove(touch: Touch, button: number, buttons: number, targetElement: Element | null): void {
    // Get touch state for this touch
    const touchState = this.touchStates.get(touch.identifier);
    if (!touchState) return;
    
    // Use the original target element from touch state, not the current element under finger
    const originalTargetElement = touchState.targetElement || targetElement;
    if (!originalTargetElement) return;
    
    // Use enhanced mouse event creation
    const mouseEvent = this.createEnhancedMouseEvent(
      'mousemove',
      touch,
      button,
      buttons,
      originalTargetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 0
      }
    );
    
    // Dispatch event with proper target
    this.dispatchEventEnhanced(mouseEvent, originalTargetElement);
    
    // Update touch state position tracking
    touchState.previousPosition = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchState.lastDispatchTime = Date.now();
  }

  /**
   * Create touch end handler - intelligent touch recognition
   */
  private createTouchEndHandler(element: Element): (event: TouchEvent) => void {
    return (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      if (!touch) return;

      const touchId = touch.identifier;
      const touchState = this.touchStates.get(touchId);
      
      if (!touchState) {
        // If no state, handle using traditional method
        this.handleTraditionalTouchEnd(element, touch);
        return;
      }

      // Clear timers
      if (touchState.timers.dragTimer) {
        clearTimeout(touchState.timers.dragTimer);
        touchState.timers.dragTimer = undefined;
      }
      if (touchState.timers.rightClickTimer) {
        clearTimeout(touchState.timers.rightClickTimer);
        touchState.timers.rightClickTimer = undefined;
      }
      if (touchState.timers.vibrateTimer) {
        clearTimeout(touchState.timers.vibrateTimer);
        touchState.timers.vibrateTimer = undefined;
        if (this.debug.enabled) {
      console.log(`[${touchId}] Vibration timer cancelled due to touch end`);
    }
      }

      // Handle end events based on mode
      switch (touchState.currentMode) {
        case 'move':
          // Normal move mode, no mouseup event needed
          break;
          
        case 'drag':
          // Drag mode, trigger mouseup event
          this.dispatchMouseUp(touch, 0, 0, touchState.targetElement);
          break;
          
        case 'rightclick':
          // Right-click mode, no additional mouseup event needed
          break;
          
        case 'pending':
          // Never moved, handle click event immediately
          this.handleClickDetection(touch, touchState);
          break;
      }

      // Clean up state (clean immediately, no need to wait for double-click state)
      this.touchStates.delete(touchId);
    };
  }

  /**
   * Traditional touch end handler (fallback)
   */
  private handleTraditionalTouchEnd(element: Element, touch: Touch): void {
    // Get touch state for this touch (create a temporary one if not exists)
    let touchState = this.touchStates.get(touch.identifier);
    if (!touchState) {
      touchState = {
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
        currentMode: 'pending',
        timers: {},
        isMouseDown: false,
        targetElement: element,
        hasMoved: false,
        clickCount: 0,
        lastClickTime: 0,
        hasVibrated: false
      };
    }
    
    // Use enhanced mouse event creation for mouseup
    const mouseEvent = this.createEnhancedMouseEvent(
      'mouseup',
      touch,
      0,
      0,
      element,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    this.dispatchEventEnhanced(mouseEvent, element);

    // Use enhanced mouse event creation for click
    const clickEvent = this.createEnhancedMouseEvent(
      'click',
      touch,
      0,
      0,
      element,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    this.dispatchEventEnhanced(clickEvent, element);
    
    // Check if we need to generate additional double click event
    this.checkAndGenerateDoubleClick(touch);
  }

  /**
   * Dispatch mouse up event
   */
  private dispatchMouseUp(touch: Touch, button: number, buttons: number, targetElement: Element | null): void {
    // Get touch state for this touch
    const touchState = this.touchStates.get(touch.identifier);
    if (!touchState) return;
    
    // Use the original target element from touch state, not the current element under finger
    const originalTargetElement = touchState.targetElement || targetElement;
    if (!originalTargetElement) return;
    
    // Use enhanced mouse event creation
    const mouseEvent = this.createEnhancedMouseEvent(
      'mouseup',
      touch,
      button,
      buttons,
      originalTargetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 0
      }
    );
    
    // Dispatch event with proper target
    this.dispatchEventEnhanced(mouseEvent, originalTargetElement);
    
    // Update touch state
    touchState.lastEventType = 'mouseup';
    touchState.lastDispatchTime = Date.now();
  }

  /**
   * Dispatch click event
   */
  private dispatchClick(touch: Touch, targetElement: Element | null): void {
    // Get touch state for this touch
    const touchState = this.touchStates.get(touch.identifier);
    if (!touchState) return;
    
    // Use the original target element from touch state, not the current element under finger
    const originalTargetElement = touchState.targetElement || targetElement;
    if (!originalTargetElement) return;
    
    // Use enhanced mouse event creation
    const clickEvent = this.createEnhancedMouseEvent(
      'click',
      touch,
      0,
      0,
      originalTargetElement,
      touchState,
      {
        bubbles: true,
        cancelable: true,
        detail: 1
      }
    );
    
    // Dispatch event with proper target
    this.dispatchEventEnhanced(clickEvent, originalTargetElement);
    
    // Update touch state
    touchState.lastEventType = 'click';
    touchState.lastDispatchTime = Date.now();
  }

  /**
   * Create touch cancel handler - intelligent touch recognition
   */
  private createTouchCancelHandler(element: Element): (event: TouchEvent) => void {
    return (event: TouchEvent) => {
      event.preventDefault();
      
      const touch = event.changedTouches[0];
      if (!touch) return;

      const touchId = touch.identifier;
      const touchState = this.touchStates.get(touchId);
      
      if (touchState) {
        // Clear timers and state (if composing, don't clear state)
        this.clearTouchTimers(touchState);
        this.touchStates.delete(touchId);
        if (this.debug.enabled) {
      console.log(`[${touchId}] Touch cancelled, vibration timer cleaned up`);
    }
      }
      
      // Get touch state for this touch (create a temporary one if not exists)
      let tempTouchState = touchState;
      if (!tempTouchState) {
        tempTouchState = {
          startTime: Date.now(),
          startX: touch.clientX,
          startY: touch.clientY,
          currentMode: 'pending',
          timers: {},
          isMouseDown: false,
          targetElement: element,
          hasMoved: false,
          clickCount: 0,
          lastClickTime: 0,
          hasVibrated: false
        };
      }
      
      // Use enhanced mouse event creation for cleanup mouseup
      const mouseEvent = this.createEnhancedMouseEvent(
        'mouseup',
        touch,
        0,
        0,
        element,
        tempTouchState,
        {
          bubbles: true,
          cancelable: true,
          detail: 0
        }
      );
      
      this.dispatchEventEnhanced(mouseEvent, element);
    };
  }


}

export { MousePolyfill };