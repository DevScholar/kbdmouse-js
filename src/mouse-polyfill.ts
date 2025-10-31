/**
 * Mouse Polyfill for Touch Devices
 * Converts touch events to mouse events for specific elements
 */

// Debug configuration for console logging
interface DebugConfig {
  enabled: boolean;
  logFunction: (message: string) => void;
}

const debug: DebugConfig = {
  enabled: false,
  logFunction: (message: string) => console.log(message)
};

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

  // Low-coupling mouse log listener - always active for DOM logging
  private mouseLogListener = (event: MouseEvent | TouchEvent) => {
    let eventType = '';
    let x = 0;
    let y = 0;
    let button: number | undefined;
    let buttons: number | undefined;
    let source: 'physical' | 'virtual' = 'physical';
    
    if (event instanceof MouseEvent) {
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
    
    // Log the mouse event using the debug format
    this.debug.logMouseEvent(eventType, x, y, button, buttons, source);
  };

  // Track if mouse log listener is enabled
  private mouseLogListenerEnabled = false;

  // Debug sub-object with configurable log function - disabled by default
  debug = {
    enabled: false,
    logFunction: (message: string) => console.log(message),
    
    // Set custom log function
    setLogFunction: (fn: (message: string) => void) => {
      this.debug.logFunction = fn;
      // Keep debug enabled when setting custom log function
      this.debug.enabled = true;
      this._debugEnabled = true;
    },
    
    // Log method that uses the configured log function
    log: (message: string) => {
      if (this.debug.enabled) {
        this.debug.logFunction(message);
      }
    },
    
    // Format timestamp as [HH:mm:ss.SSS]
    formatTimestamp: (): string => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
      return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
    },
    
    // Log mouse/touch event in specified format
    logMouseEvent: (eventType: string, x: number, y: number, button?: number, buttons?: number, source: 'physical' | 'virtual' = 'virtual') => {
      const timestamp = this.debug.formatTimestamp();
      let logMessage = `${timestamp}event=${eventType},x=${x},y=${y}`;
      
      // Add button and buttons for mouse events
      if (button !== undefined) {
        logMessage += `,button=${button}`;
      }
      if (buttons !== undefined) {
        logMessage += `,buttons=${buttons}`;
      }
      
      logMessage += `,source=${source}`;
      this.debug.log(logMessage);
    }
  };

  private log(message: string, ...args: any[]): void {
    const formattedMessage = `[MousePolyfill] ${message}`;
    if (args.length > 0) {
      this.debug.log(`${formattedMessage} ${args.map(arg => JSON.stringify(arg)).join(' ')}`);
    } else {
      this.debug.log(formattedMessage);
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
   */
  enableMouseLogListener(element: Element): void {
    if (this.mouseLogListenerEnabled) return;
    
    element.addEventListener('mousedown', this.mouseLogListener as EventListener);
    element.addEventListener('mouseup', this.mouseLogListener as EventListener);
    element.addEventListener('mousemove', this.mouseLogListener as EventListener);
    element.addEventListener('click', this.mouseLogListener as EventListener);
    element.addEventListener('dblclick', this.mouseLogListener as EventListener);
    element.addEventListener('contextmenu', this.mouseLogListener as EventListener);
    element.addEventListener('touchstart', this.mouseLogListener as EventListener);
    element.addEventListener('touchend', this.mouseLogListener as EventListener);
    element.addEventListener('touchmove', this.mouseLogListener as EventListener);
    
    this.mouseLogListenerEnabled = true;
    this.log('Mouse log listener enabled');
  }

  /**
   * Disable mouse log listener
   * @param element The element to remove listeners from
   */
  disableMouseLogListener(element: Element): void {
    if (!this.mouseLogListenerEnabled) return;
    
    element.removeEventListener('mousedown', this.mouseLogListener as EventListener);
    element.removeEventListener('mouseup', this.mouseLogListener as EventListener);
    element.removeEventListener('mousemove', this.mouseLogListener as EventListener);
    element.removeEventListener('click', this.mouseLogListener as EventListener);
    element.removeEventListener('dblclick', this.mouseLogListener as EventListener);
    element.removeEventListener('contextmenu', this.mouseLogListener as EventListener);
    element.removeEventListener('touchstart', this.mouseLogListener as EventListener);
    element.removeEventListener('touchend', this.mouseLogListener as EventListener);
    element.removeEventListener('touchmove', this.mouseLogListener as EventListener);
    
    this.mouseLogListenerEnabled = false;
    this.log('Mouse log listener disabled');
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
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();

    // mousedown
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: clickCount,
      button: 0,
      buttons: 1,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (mouseDownEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(mouseDownEvent);

    // mouseup
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: clickCount,
      button: 0,
      buttons: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (mouseUpEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(mouseUpEvent);

    // click
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: clickCount,
      button: 0,
      buttons: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (clickEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(clickEvent);

    // dblclick (only on second click)
    if (isDoubleClick) {
      const doubleClickEvent = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 2,
        button: 0,
        buttons: 0,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        relatedTarget: null,
        ctrlKey: modifiers.ctrl,
        altKey: modifiers.alt,
        shiftKey: modifiers.shift,
        metaKey: modifiers.meta
      });
      (doubleClickEvent as any).isPolyfill = true;
      targetElement.dispatchEvent(doubleClickEvent);
    }
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
        
        // Get current modifier states from virtual keyboard
        const modifiers = this.getModifierStates();
        
        // Generate additional double click event
        const doubleClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 2,
          button: 0,
          buttons: 0,
          clientX: currentTouch.clientX,
          clientY: currentTouch.clientY,
          screenX: currentTouch.screenX,
          screenY: currentTouch.screenY,
          relatedTarget: null,
          ctrlKey: modifiers.ctrl,
          altKey: modifiers.alt,
          shiftKey: modifiers.shift,
          metaKey: modifiers.meta
        });
        (doubleClickEvent as any).isPolyfill = true;
        
        const targetElement = document.elementFromPoint(currentTouch.clientX, currentTouch.clientY);
        if (targetElement) {
          targetElement.dispatchEvent(doubleClickEvent);
        }
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

    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();

    // 1. mousedown
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      button: 0,
      buttons: 1,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (mouseDownEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(mouseDownEvent);

    // 2. mouseup
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      button: 0,
      buttons: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (mouseUpEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(mouseUpEvent);

    // 3. click
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      button: 0,
      buttons: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (clickEvent as any).isPolyfill = true;
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
    
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();
    
    const mouseEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 1,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });

    (mouseEvent as any).isPolyfill = true;
    
    if (touchState.targetElement) {
      touchState.targetElement.dispatchEvent(mouseEvent);
    }
  }

  /**
   * Right-click event sequence: mousedown → mouseup → contextmenu
   * Emulates the complete event sequence of physical mouse right-click
   */
  private rightClick(touch: Touch, targetElement: Element): void {
    console.log(`[${touch.identifier}] Triggering right-click sequence`);
    
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();
    
    // mousedown (button=2, buttons=2)
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      button: 2,
      buttons: 2,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (mouseDownEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(mouseDownEvent);

    // mouseup (button=2, buttons=0)
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      button: 2,
      buttons: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (mouseUpEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(mouseUpEvent);

    // contextmenu (button=2, buttons=0)
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 0,
      button: 2,
      buttons: 0,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });
    (contextMenuEvent as any).isPolyfill = true;
    targetElement.dispatchEvent(contextMenuEvent);
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
        hasVibrated: false
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
      
      // Check if movement exceeds threshold
      if (distance > this.MOVE_THRESHOLD_DISTANCE) {
        touchState.hasMoved = true;
        
        // Cancel vibration timer if movement is detected
        if (touchState.timers.vibrateTimer) {
          clearTimeout(touchState.timers.vibrateTimer);
          touchState.timers.vibrateTimer = undefined;
          if (debug.enabled) {
      console.log(`[${touchId}] Vibration cancelled due to movement`);
    }
        }
        
        // Determine mode based on time and current state
          if (touchState.currentMode === 'pending') {
            const elapsedTime = Date.now() - touchState.startTime;
            
            if (debug.enabled) {
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

      // Handle movement based on current mode
      switch (touchState.currentMode) {
        case 'move':
          // Normal mouse movement mode (no button pressed)
          this.dispatchMouseMove(touch, 0, 0, touchState.targetElement);
          break;
          
        case 'drag':
          // Drag mode (mouse button pressed state)
          this.dispatchMouseMove(touch, 0, 1, touchState.targetElement);
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
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();
    
    const mouseEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 0,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: button,
      buttons: buttons,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });

    (mouseEvent as any).isPolyfill = true;
    
    // Get element at current touch position
    const currentTargetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const dispatchElement = currentTargetElement || targetElement;
    
    if (dispatchElement) {
      dispatchElement.dispatchEvent(mouseEvent);
    }
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
        if (debug.enabled) {
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
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();
    
    const mouseEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 0,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });

    (mouseEvent as any).isPolyfill = true;
    element.dispatchEvent(mouseEvent);

    // Also dispatch click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 0,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });

    (clickEvent as any).isPolyfill = true;
    element.dispatchEvent(clickEvent);
    
    // Check if we need to generate additional double click event
    this.checkAndGenerateDoubleClick(touch);
  }

  /**
   * Dispatch mouse up event
   */
  private dispatchMouseUp(touch: Touch, button: number, buttons: number, targetElement: Element | null): void {
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();
    
    const mouseEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: button,
      buttons: buttons,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });

    (mouseEvent as any).isPolyfill = true;
    
    const currentTargetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const dispatchElement = currentTargetElement || targetElement;
    
    if (dispatchElement) {
      dispatchElement.dispatchEvent(mouseEvent);
    }
  }

  /**
   * Dispatch click event
   */
  private dispatchClick(touch: Touch, targetElement: Element | null): void {
    // Get current modifier states from virtual keyboard
    const modifiers = this.getModifierStates();
    
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      buttons: 0,
      relatedTarget: null,
      ctrlKey: modifiers.ctrl,
      altKey: modifiers.alt,
      shiftKey: modifiers.shift,
      metaKey: modifiers.meta
    });

    (clickEvent as any).isPolyfill = true;
    
    const currentTargetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const dispatchElement = currentTargetElement || targetElement;
    
    if (dispatchElement) {
      dispatchElement.dispatchEvent(clickEvent);
    }
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
        if (debug.enabled) {
      console.log(`[${touchId}] Touch cancelled, vibration timer cleaned up`);
    }
      }
      
      // Get current modifier states from virtual keyboard
      const modifiers = this.getModifierStates();
      
      // Trigger mouseup event as cleanup
      const mouseEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 0,
        button: 0,
        buttons: 0,
        relatedTarget: null,
        ctrlKey: modifiers.ctrl,
        altKey: modifiers.alt,
        shiftKey: modifiers.shift,
        metaKey: modifiers.meta
      });

      (mouseEvent as any).isPolyfill = true;
      element.dispatchEvent(mouseEvent);
    };
  }


}

export { MousePolyfill };