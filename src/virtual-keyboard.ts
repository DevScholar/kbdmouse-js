import type { VirtualKey } from './virtual-key.js';

export class VirtualKeyboard extends HTMLElement {

  constructor() {
    super();
    this.initializeFocusManagement();
    // Initialize NumLock to be OFF by default (like real keyboards)
    this.initializeNumLockState();
  }

  // Static property to observe attributes
  static get observedAttributes(): string[] {
    return [];
  }

  connectedCallback() {
    this.render();
    this.setupFocusListeners();
  }

  visual = {
    // Apply visual press effect to a key
    applyKeyDownEffect: (virtualKey: VirtualKey) => {
      if (virtualKey) {
        virtualKey.classList.add('key-down');
        virtualKey.setAttribute('aria-pressed', 'true');
        
        // Handle Shift key down - add shift class to letter and number keys
        if (this.keys.isModifierKey(virtualKey) && virtualKey.getAttribute('code')?.startsWith('Shift')) {
          this.visual.applyShiftVisualEffect(true);
        }
        
        // Note: Visual effects for physical toggle keys (Caps Lock, Num Lock) are determined by system state
        // Only handle visual effects for modifier keys here, visual effects for physical toggle keys are handled by OS state feedback
      }
    },

    // Remove visual press effect from a key
    applyKeyUpEffect: (virtualKey: VirtualKey) => {
      if (virtualKey) {
        // Physical toggle keys (Caps Lock, Num Lock) maintain toggle state display
        if (this.keys.isPhysicalToggleKey(virtualKey)) {
          const code = virtualKey.getAttribute('code') || '';
          const toggleState = this.state.getToggleState(code);
          
          // Update aria-pressed state to toggle state
          virtualKey.setAttribute('aria-pressed', toggleState ? 'true' : 'false');
          
          // Keep key-down class if toggle state is active
          if (!toggleState) {
            virtualKey.classList.remove('key-down');
          }
        }
        // Modifier keys (Shift, Ctrl, Alt, Meta) maintain toggle state
        else if (this.keys.isModifierKey(virtualKey)) {
          // Check if modifier key is still pressed (toggle state)
          const isToggleActive = this.state.isKeyDown(virtualKey);
          
          // Update aria-pressed state
          virtualKey.setAttribute('aria-pressed', isToggleActive ? 'true' : 'false');
          
          // Remove key-down class if modifier key is no longer pressed
          if (!isToggleActive) {
            virtualKey.classList.remove('key-down');
          }
        } else {
          // For regular keys, always remove key-down and set aria-pressed to false
          virtualKey.classList.remove('key-down');
          virtualKey.setAttribute('aria-pressed', 'false');
        }
        
        // Handle Shift key up - remove shift class from letter and number keys
        if (this.keys.isModifierKey(virtualKey) && virtualKey.getAttribute('code')?.startsWith('Shift')) {
          // Only remove shift class if no other Shift keys are pressed
          const modifiers = this.state.getModifierStates();
          if (!modifiers.shift) {
            this.visual.applyShiftVisualEffect(false);
          }
        }
        
        // Handle Caps Lock key up - remove caps-lock class from letter keys
        if (this.keys.isCapsLockKey(virtualKey)) {
          // Only remove caps-lock class if Caps Lock is not active
          const modifiers = this.state.getModifierStates();
          if (!modifiers.capsLock) {
            this.visual.applyCapsLockVisualEffect(false);
          }
        }
        
        // Handle Num Lock key up - remove num-lock class from numpad keys
        if (this.keys.isNumLockKey(virtualKey)) {
          // Only remove num-lock class if Num Lock is not active
          const modifiers = this.state.getModifierStates();
          if (!modifiers.numLock) {
            this.visual.applyNumLockVisualEffect(false);
          }
        }
      }
    },
    
    // Apply or remove shift visual effect to letter and number keys
    applyShiftVisualEffect: (apply: boolean) => {
      const letterKeys = this.querySelectorAll('virtual-key[code^="Key"]') as NodeListOf<VirtualKey>;
      const numberKeys = this.querySelectorAll('virtual-key[code^="Digit"]') as NodeListOf<VirtualKey>;
      
      [...letterKeys, ...numberKeys].forEach(key => {
        if (apply) {
          key.classList.add('shift');
        } else {
          key.classList.remove('shift');
        }
      });
    },
    
    // Apply or remove caps-lock visual effect to letter keys
    applyCapsLockVisualEffect: (apply: boolean) => {
      const letterKeys = this.querySelectorAll('virtual-key[code^="Key"]') as NodeListOf<VirtualKey>;
      
      letterKeys.forEach(key => {
        if (apply) {
          key.classList.add('caps-lock');
        } else {
          key.classList.remove('caps-lock');
        }
      });
    },

    // Apply or remove num-lock visual effect to numpad keys
    applyNumLockVisualEffect: (apply: boolean) => {
      const numpadKeys = this.querySelectorAll('virtual-key[code^="Numpad"]') as NodeListOf<VirtualKey>;
      
      numpadKeys.forEach(key => {
        if (apply) {
          key.classList.add('num-lock');
        } else {
          key.classList.remove('num-lock');
        }
      });
    },

    // Apply visual effect when a key is pressed down
    applyKeyDownVisualEffect: (virtualKey: VirtualKey) => {
      if (virtualKey) {
        virtualKey.classList.add('key-down');
      }
    },

    // Remove visual effect when a key is released
    applyKeyUpVisualEffect: (virtualKey: VirtualKey) => {
      if (virtualKey) {
        virtualKey.classList.remove('key-down');
      }
    },

    // Toggle the visual state of a key (for toggle keys like Caps Lock)
    toggleKeyState: (virtualKey: VirtualKey, state: boolean) => {
      if (virtualKey) {
        if (state) {
          virtualKey.classList.add('key-active');
        } else {
          virtualKey.classList.remove('key-active');
        }
      }
    },

    // Apply a custom CSS class to a key
    addKeyClass: (virtualKey: VirtualKey, className: string) => {
      if (virtualKey) {
        virtualKey.classList.add(className);
      }
    },

    // Remove a custom CSS class from a key
    removeKeyClass: (virtualKey: VirtualKey, className: string) => {
      if (virtualKey) {
        virtualKey.classList.remove(className);
      }
    }
  };

  state = {
    // Track currently keyDown keys
    keyDownKeys: [] as VirtualKey[],
    
    // Set of currently keyDown modifier keys
    keyDownModifiers: new Set<string>(),
    
    // Map of toggle key states
    toggleStates: new Map<string, boolean>(),

    // Key repeat functionality
    repeatTimer: null as number | null,
    repeatInterval: 50, // ms between repeats
    repeatDelay: 500, // ms before starting repeat
    isRepeating: false,
    repeatKey: null as VirtualKey | null,

    // Check if a key is currently keyDown
    isKeyDown: (virtualKey: VirtualKey): boolean => {
      return this.state.keyDownKeys.includes(virtualKey);
    },

    // Add key to keyDown state
    addKeyDownKey: (virtualKey: VirtualKey) => {
      if (!this.state.keyDownKeys.includes(virtualKey)) {
        this.state.keyDownKeys.push(virtualKey);
      }
    },

    // Remove key from keyDown state
    removeKeyDownKey: (virtualKey: VirtualKey) => {
      const index = this.state.keyDownKeys.indexOf(virtualKey);
      if (index !== -1) {
        this.state.keyDownKeys.splice(index, 1);
      }
    },

    // Check if a key is currently pressed by code
    isKeyPressed: (code: string): boolean => {
      return this.state.keyDownKeys.some(key => key.getAttribute('code') === code);
    },

    // Get list of currently pressed keys
    getPressedKeys: (): VirtualKey[] => {
      return [...this.state.keyDownKeys];
    },

    // Add a modifier key to keyDown set
    addModifier: (modifier: string) => {
      this.state.keyDownModifiers.add(modifier);
    },

    // Remove a modifier key from keyDown set
    removeModifier: (modifier: string) => {
      this.state.keyDownModifiers.delete(modifier);
    },

    // Get list of keyDown modifier keys
    getKeyDownModifiers: (): string[] => {
      return Array.from(this.state.keyDownModifiers);
    },

    // Check if a modifier is keyDown
    isModifierKeyDown: (modifier: string): boolean => {
      return this.state.keyDownModifiers.has(modifier);
    },

    // Set toggle key state
    setToggleState: (code: string, state: boolean) => {
      this.state.toggleStates.set(code, state);
    },

    // Get toggle key state
    getToggleState: (code: string): boolean => {
      return this.state.toggleStates.get(code) || false;
    },

    // Clear all keyDown keys (useful for reset)
    clearAllKeyDownKeys: () => {
      this.state.keyDownKeys.length = 0;
    },

    // Reset all modifier states
    resetModifiers: () => {
      this.state.keyDownModifiers.clear();
    },

    // Key up all modifier keys (trigger keyup first, then remove from keyDown set)
    keyUpAllModifiers: () => {
      const keyDownModifiers = this.state.getKeyDownModifiers();
      // Create a copy of the array to avoid modification during iteration
      const modifiersToRelease = [...keyDownModifiers];
      
      modifiersToRelease.forEach(modifier => {
        // Find the virtual key for this modifier and trigger keyup
        const modifierKey = this.keys.findByCode(modifier);
        if (modifierKey && this.state.isKeyDown(modifierKey)) {
          // Don't modify toggle state here - let keyUp handle it
          // Just trigger the keyup which will handle all state cleanup
          this.keyUp(modifierKey);
        }
      });
    },

    // Reset all toggle states
    resetToggleStates: () => {
      this.state.toggleStates.clear();
    },

    // Reset all keyboard states
    resetAllStates: () => {
      this.state.clearAllKeyDownKeys();
      this.state.resetModifiers();
      this.state.resetToggleStates();
      this.state.stopRepeat();
    },

    // Key repeat control methods
    startRepeat: (virtualKey: VirtualKey) => {
      // Don't repeat toggle keys or modifier keys
      if (this.keys.isPhysicalToggleKey(virtualKey) || this.keys.isModifierKey(virtualKey)) {
        return;
      }

      // Stop any existing repeat
      this.state.stopRepeat();

      // Set up repeat state
      this.state.repeatKey = virtualKey;
      this.state.isRepeating = false;

      // Start delay timer
      this.state.repeatTimer = window.setTimeout(() => {
        this.state.isRepeating = true;
        this.state.repeatTimer = window.setInterval(() => {
          if (this.state.repeatKey && this.state.isKeyDown(this.state.repeatKey)) {
            // Use repeatingKeyDown for key repeat - only sends events, doesn't change state
            this.keyState.repeatingKeyDown(this.state.repeatKey);
          } else {
            // Key is no longer pressed, stop repeat
            this.state.stopRepeat();
          }
        }, this.state.repeatInterval);
      }, this.state.repeatDelay);
    },

    stopRepeat: () => {
      if (this.state.repeatTimer !== null) {
        window.clearTimeout(this.state.repeatTimer);
        window.clearInterval(this.state.repeatTimer);
        this.state.repeatTimer = null;
      }
      if (this.state.repeatKey) {
      }
      this.state.isRepeating = false;
      this.state.repeatKey = null;
    },

    // Get current modifier key states
    getModifierStates: () => {
      return {
        shift: this.state.isModifierKeyDown('Shift'),
        ctrl: this.state.isModifierKeyDown('Control'),
        alt: this.state.isModifierKeyDown('Alt'),
        meta: this.state.isModifierKeyDown('Meta'),
        capsLock: this.state.getToggleState('CapsLock'),
        numLock: this.state.getToggleState('NumLock'),
        hasOtherModifiers: this.state.isModifierKeyDown('Control') || this.state.isModifierKeyDown('Alt') || this.state.isModifierKeyDown('Meta')
      };
    }
  };

  keys = {
    // ====== Independent key categorization system - mutually exclusive ======
    
    // 1. Physical toggle keys: Caps Lock, Num Lock - each key press sends complete keydown/keyup event pair
    isPhysicalToggleKey: (virtualKey: VirtualKey): boolean => {
      const code = virtualKey.getAttribute("code");
      return code === "CapsLock" || code === "NumLock";
    },

    // 2. Modifier keys: Shift, Ctrl, Alt, Meta - active while held, can be combined
    isModifierKey: (virtualKey: VirtualKey): boolean => {
      const code = virtualKey.getAttribute("code");
      return !!(code && (
        code.startsWith("Shift") || 
        code.startsWith("Control") || 
        code.startsWith("Alt") || 
        code.startsWith("Meta")
      ));
    },

    // 3. Normal keys: support key repeat, regular behavior
    isNormalKey: (virtualKey: VirtualKey): boolean => {
      return !this.keys.isPhysicalToggleKey(virtualKey) && !this.keys.isModifierKey(virtualKey);
    },

    // 4. Old toggle key concept - now clearly divided into physical toggle keys and modifier keys
    // This method is kept for compatibility with existing code, but should gradually be replaced with more explicit categorization
    isToggleKey: (virtualKey: VirtualKey): boolean => {
      return this.keys.isPhysicalToggleKey(virtualKey) || this.keys.isModifierKey(virtualKey);
    },

    // Helper methods
    isCapsLockKey: (virtualKey: VirtualKey): boolean => {
      const code = virtualKey.getAttribute("code");
      return code === "CapsLock";
    },

    isNumLockKey: (virtualKey: VirtualKey): boolean => {
      const code = virtualKey.getAttribute("code");
      return code === "NumLock";
    },

    // Check if a key is located on the main keyboard area (excluding numpad, function keys, navigation keys)
    isMainKeyboardKey: (virtualKey: VirtualKey): boolean => {
      const code = virtualKey.getAttribute('code') || '';
      
      // Exclude numpad keys
      if (code.startsWith('Numpad')) {
        return false;
      }
      
      // Exclude function keys F1-F12
      if (code.match(/^F[1-9]|F1[0-2]$/)) {
        return false;
      }
      
      // Exclude navigation and editing keys
      const nonMainKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Home', 'End', 'PageUp', 'PageDown',
        'Insert', 'Delete',
        'Escape'
      ];
      
      if (nonMainKeys.includes(code)) {
        return false;
      }
      
      // All other keys are considered main keyboard keys
      return true;
    },

    // Find virtual key element by code attribute
    findByCode: (code: string): VirtualKey | null => {
      return this.querySelector(`virtual-key[code="${code}"]`) as VirtualKey | null;
    }
  };

  event = {
// Helper function to get keyCode/which values for legacy properties
    getLegacyKeyCode: (key: string, code: string): number => {
      // Map common keys to their legacy keyCode values
      const keyCodeMap: { [key: string]: number } = {
        'Backspace': 8, 'Tab': 9, 'Enter': 13, 'Escape': 27, 'Space': 32,
        'PageUp': 33, 'PageDown': 34, 'End': 35, 'Home': 36,
        'ArrowLeft': 37, 'ArrowUp': 38, 'ArrowRight': 39, 'ArrowDown': 40,
        'Insert': 45, 'Delete': 46,
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52, '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
        'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74,
        'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84,
        'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89, 'z': 90,
        'F1': 112, 'F2': 113, 'F3': 114, 'F4': 115, 'F5': 116, 'F6': 117,
        'F7': 118, 'F8': 119, 'F9': 120, 'F10': 121, 'F11': 122, 'F12': 123
      };
      
      // Try to get from key first, then code
      return keyCodeMap[key] || keyCodeMap[code.replace('Key', '')] || 0;
    },

    // Helper function to get correct location value for keys
    getKeyLocation: (code: string): number => {
      // Standard keys: location 0
      // Left-side keys: location 1
      if (code === 'ShiftLeft' || code === 'ControlLeft' || code === 'AltLeft' || code === 'MetaLeft') {
        return 1;
      }
      // Right-side keys: location 2  
      if (code === 'ShiftRight' || code === 'ControlRight' || code === 'AltRight' || code === 'MetaRight') {
        return 2;
      }
      // Numpad keys: location 3
      if (code.startsWith('Numpad')) {
        return 3;
      }
      // Everything else: standard location
      return 0;
    },

    // Dispatch keydown event to window
    dispatchKeyDown: (virtualKey: VirtualKey) => {
      const code = virtualKey.getAttribute('code') || '';
      
      // Collect current modifier states before creating the event
      const modifiers = this.state.getModifierStates();
      
      // Determine the correct key value based on modifier state
      let key = virtualKey.getAttribute('key') || virtualKey.getAttribute('label') || '';
      
      // Handle NumLock state for numpad keys
      if (code.startsWith('Numpad')) {
        // When NumLock is OFF, numpad number keys should produce navigation keys
        if (!modifiers.numLock) {
          switch (code) {
            case 'Numpad0': key = 'Insert'; break;
            case 'Numpad1': key = 'End'; break;
            case 'Numpad2': key = 'ArrowDown'; break;
            case 'Numpad3': key = 'PageDown'; break;
            case 'Numpad4': key = 'ArrowLeft'; break;
            case 'Numpad5': key = 'Clear'; break;
            case 'Numpad6': key = 'ArrowRight'; break;
            case 'Numpad7': key = 'Home'; break;
            case 'Numpad8': key = 'ArrowUp'; break;
            case 'Numpad9': key = 'PageUp'; break;
            case 'NumpadDecimal': key = 'Delete'; break;
          }
        }
        // When NumLock is ON, use the number keys as normal
        // But still handle Shift for numpad keys (e.g., Shift+Numpad7 = Home)
        else if (modifiers.shift) {
          const shiftKey = virtualKey.getAttribute('shift-key') || '';
          if (shiftKey) {
            key = shiftKey;
          }
        }
      }
      // Handle letter keys with Caps Lock + Shift combination (should be lowercase)
      else if (code.startsWith('Key') && modifiers.capsLock && modifiers.shift) {
        key = key.toLowerCase();
      }
      // Handle other cases with Shift (number keys and other keys with shift-text)
      else if (modifiers.shift) {
        const shiftKey = virtualKey.getAttribute('shift-key') || '';
        const shiftCode = virtualKey.getAttribute('shift-code') || '';
        if (shiftKey || shiftCode) {
          key = shiftKey || shiftCode;
        }
      }
      // Handle Caps Lock only (should be uppercase)
      else if (modifiers.capsLock) {
        key = key.toUpperCase();
      }

      const keyDownEvent = new KeyboardEvent('keydown', {
        key: key,
        code: code,
        location: this.event.getKeyLocation(code),
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        // Include modifier key states to match standard KeyboardEvent behavior
        shiftKey: modifiers.shift,
        ctrlKey: modifiers.ctrl,
        altKey: modifiers.alt,
        metaKey: modifiers.meta,
        // Add missing standard properties
        repeat: false, // Virtual keyboard doesn't auto-repeat initially
        isComposing: false // Not part of composition session
      });

      // Add getModifierState method to match standard KeyboardEvent interface
      (keyDownEvent as any).getModifierState = (keyArg: string) => {
        switch (keyArg) {
          case 'Shift': return modifiers.shift;
          case 'Control': return modifiers.ctrl;
          case 'Alt': return modifiers.alt;
          case 'Meta': return modifiers.meta;
          case 'CapsLock': return modifiers.capsLock;
          case 'NumLock': return modifiers.numLock;
          default: return false;
        }
      };
      
      // Add standard DOM event methods
      (keyDownEvent as any).preventDefault = function() {
        this.returnValue = false;
      };
      
      (keyDownEvent as any).stopPropagation = function() {
        this._stopPropagation = true;
      };
      
      (keyDownEvent as any).stopImmediatePropagation = function() {
        this._stopImmediatePropagation = true;
        this._stopPropagation = true;
      };
      
      // Add legacy properties for backward compatibility (deprecated but still used)
      const keyCode = this.event.getLegacyKeyCode(key, code);
      Object.defineProperty(keyDownEvent, 'keyCode', {
        value: keyCode,
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(keyDownEvent, 'charCode', {
        value: 0, // keydown events don't have charCode
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(keyDownEvent, 'which', {
        value: keyCode, // which should match keyCode for keydown
        writable: false,
        configurable: false
      });

      (keyDownEvent as any).isVirtualKeyboard = true;
      (keyDownEvent as any).virtualKeyElement = virtualKey;
      
      // Add timeStamp if not present (isTrusted is read-only and managed by browser)
      if (!keyDownEvent.timeStamp) {
        Object.defineProperty(keyDownEvent, 'timeStamp', {
          value: performance.now(),
          writable: false,
          configurable: false
        });
      }
      
      // Add inputType for input-related events (keyboard input)
      Object.defineProperty(keyDownEvent, 'inputType', {
        value: 'insertText',
        writable: false,
        configurable: false
      });
      
      // Set target to the currently focused element to match physical keyboard behavior
      // Virtual keyboard should not steal focus - events should go to the active element (maintain focus)
      const activeElement = this.editing.activeElement || document.activeElement || document.body;
      Object.defineProperty(keyDownEvent, 'target', {
        value: activeElement,
        writable: false
      });
      
      // Add event chain properties
      Object.defineProperty(keyDownEvent, 'currentTarget', {
        value: activeElement,
        writable: false
      });
      
      Object.defineProperty(keyDownEvent, 'eventPhase', {
        value: Event.BUBBLING_PHASE,
        writable: false
      });
      
      Object.defineProperty(keyDownEvent, 'defaultPrevented', {
        get: function() {
          return this.returnValue === false;
        },
        enumerable: true
      });
      
      // Dispatch from document to allow natural event flow for third-party listeners
      // This ensures the event goes through the complete capture-target-bubble phases
      document.dispatchEvent(keyDownEvent);
    },

    // Dispatch keyup event to window
    dispatchKeyUp: (virtualKey: VirtualKey) => {
      const code = virtualKey.getAttribute('code') || '';
      
      // Collect current modifier states before creating the event
      const modifiers = this.state.getModifierStates();
      
      // Determine the correct key value based on modifier state
      let key = virtualKey.getAttribute('key') || virtualKey.getAttribute('label') || '';
      
      // Handle NumLock state for numpad keys
      if (code.startsWith('Numpad')) {
        // When NumLock is OFF, numpad number keys should produce navigation keys
        if (!modifiers.numLock) {
          switch (code) {
            case 'Numpad0': key = 'Insert'; break;
            case 'Numpad1': key = 'End'; break;
            case 'Numpad2': key = 'ArrowDown'; break;
            case 'Numpad3': key = 'PageDown'; break;
            case 'Numpad4': key = 'ArrowLeft'; break;
            case 'Numpad5': key = 'Clear'; break;
            case 'Numpad6': key = 'ArrowRight'; break;
            case 'Numpad7': key = 'Home'; break;
            case 'Numpad8': key = 'ArrowUp'; break;
            case 'Numpad9': key = 'PageUp'; break;
            case 'NumpadDecimal': key = 'Delete'; break;
          }
        }
        // When NumLock is ON, use the number keys as normal
        // But still handle Shift for numpad keys (e.g., Shift+Numpad7 = Home)
        else if (modifiers.shift) {
          const shiftKey = virtualKey.getAttribute('shift-key') || '';
          if (shiftKey) {
            key = shiftKey;
          }
        }
      }
      // Handle letter keys with Caps Lock + Shift combination (should be lowercase)
      else if (code.startsWith('Key') && modifiers.capsLock && modifiers.shift) {
        key = key.toLowerCase();
      }
      // Handle other cases with Shift (number keys and other keys with shift-text)
      else if (modifiers.shift) {
        const shiftKey = virtualKey.getAttribute('shift-key') || '';
        const shiftCode = virtualKey.getAttribute('shift-code') || '';
        if (shiftKey || shiftCode) {
          key = shiftKey || shiftCode;
        }
      }
      // Handle Caps Lock only (should be uppercase)
      else if (modifiers.capsLock) {
        key = key.toUpperCase();
      }

      const keyUpEvent = new KeyboardEvent('keyup', {
        key: key,
        code: code,
        location: this.event.getKeyLocation(code),
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        // Include modifier key states to match standard KeyboardEvent behavior
        shiftKey: modifiers.shift,
        ctrlKey: modifiers.ctrl,
        altKey: modifiers.alt,
        metaKey: modifiers.meta,
        // Add missing standard properties
        repeat: false, // Virtual keyboard doesn't auto-repeat initially
        isComposing: false // Not part of composition session
      });

      // Add getModifierState method to match standard KeyboardEvent interface
      (keyUpEvent as any).getModifierState = (keyArg: string) => {
        switch (keyArg) {
          case 'Shift': return modifiers.shift;
          case 'Control': return modifiers.ctrl;
          case 'Alt': return modifiers.alt;
          case 'Meta': return modifiers.meta;
          case 'CapsLock': return modifiers.capsLock;
          case 'NumLock': return modifiers.numLock;
          default: return false;
        }
      };
      
      // Add standard DOM event methods
      (keyUpEvent as any).preventDefault = function() {
        this.returnValue = false;
      };
      
      (keyUpEvent as any).stopPropagation = function() {
        this._stopPropagation = true;
      };
      
      (keyUpEvent as any).stopImmediatePropagation = function() {
        this._stopImmediatePropagation = true;
        this._stopPropagation = true;
      };
      
      // Add legacy properties for backward compatibility (deprecated but still used)
      const keyCode = this.event.getLegacyKeyCode(key, code);
      Object.defineProperty(keyUpEvent, 'keyCode', {
        value: keyCode,
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(keyUpEvent, 'charCode', {
        value: 0, // keyup events don't have charCode
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(keyUpEvent, 'which', {
        value: keyCode, // which should match keyCode for keyup
        writable: false,
        configurable: false
      });

      (keyUpEvent as any).isVirtualKeyboard = true;
      (keyUpEvent as any).virtualKeyElement = virtualKey;
      
      // Add timeStamp if not present (isTrusted is read-only and managed by browser)
      if (!keyUpEvent.timeStamp) {
        Object.defineProperty(keyUpEvent, 'timeStamp', {
          value: performance.now(),
          writable: false,
          configurable: false
        });
      }
      
      // Add inputType for input-related events (keyboard input)
      Object.defineProperty(keyUpEvent, 'inputType', {
        value: 'insertText',
        writable: false,
        configurable: false
      });
      
      // Set target to the currently focused element to match physical keyboard behavior
      // Virtual keyboard should not steal focus - events should go to the active element (maintain focus)
      const activeElement = this.editing.activeElement || document.activeElement || document.body;
      Object.defineProperty(keyUpEvent, 'target', {
        value: activeElement,
        writable: false
      });
      
      // Add event chain properties
      Object.defineProperty(keyUpEvent, 'currentTarget', {
        value: activeElement,
        writable: false
      });
      
      Object.defineProperty(keyUpEvent, 'eventPhase', {
        value: Event.BUBBLING_PHASE,
        writable: false
      });
      
      Object.defineProperty(keyUpEvent, 'defaultPrevented', {
        get: function() {
          return this.returnValue === false;
        },
        enumerable: true
      });
      
      // Dispatch from document to allow natural event flow for third-party listeners
      // This ensures the event goes through the complete capture-target-bubble phases
      document.dispatchEvent(keyUpEvent);
    },

    // Dispatch keypress event to window (for eligible keys)
    dispatchKeyPress: (virtualKey: VirtualKey) => {
      const code = virtualKey.getAttribute('code') || '';
      
      // Only dispatch keypress for keys that produce character input
      // Skip modifier keys, navigation keys, and function keys
      if (this.keys.isModifierKey(virtualKey) || 
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 
           'Insert', 'Delete', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 
           'F10', 'F11', 'F12'].includes(code)) {
        return;
      }
      
      // Collect current modifier states before creating the event
      const modifiers = this.state.getModifierStates();
      
      // Determine the correct key value based on modifier state
      let key = virtualKey.getAttribute('key') || virtualKey.getAttribute('label') || '';
      
      // Handle NumLock state for numpad keys
      if (code.startsWith('Numpad')) {
        // When NumLock is OFF, numpad number keys should produce navigation keys (skip keypress)
        if (!modifiers.numLock) {
          return;
        }
        // When NumLock is ON, use the number keys as normal
        else if (modifiers.shift) {
          const shiftKey = virtualKey.getAttribute('shift-key') || '';
          if (shiftKey) {
            key = shiftKey;
          }
        }
      }
      // Handle letter keys with Caps Lock + Shift combination (should be lowercase)
      else if (code.startsWith('Key') && modifiers.capsLock && modifiers.shift) {
        key = key.toLowerCase();
      }
      // Handle other cases with Shift (number keys and other keys with shift-text)
      else if (modifiers.shift) {
        const shiftKey = virtualKey.getAttribute('shift-key') || '';
        const shiftCode = virtualKey.getAttribute('shift-code') || '';
        if (shiftKey || shiftCode) {
          key = shiftKey || shiftCode;
        }
      }
      // Handle Caps Lock only (should be uppercase)
      else if (modifiers.capsLock) {
        key = key.toUpperCase();
      }

      const keyPressEvent = new KeyboardEvent('keypress', {
        key: key,
        code: code,
        location: this.event.getKeyLocation(code),
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        // Include modifier key states to match standard KeyboardEvent behavior
        shiftKey: modifiers.shift,
        ctrlKey: modifiers.ctrl,
        altKey: modifiers.alt,
        metaKey: modifiers.meta,
        // Add missing standard properties
        repeat: false, // Virtual keyboard doesn't auto-repeat initially
        isComposing: false // Not part of composition session
      });

      // Add getModifierState method to match standard KeyboardEvent interface
      (keyPressEvent as any).getModifierState = (keyArg: string) => {
        switch (keyArg) {
          case 'Shift': return modifiers.shift;
          case 'Control': return modifiers.ctrl;
          case 'Alt': return modifiers.alt;
          case 'Meta': return modifiers.meta;
          case 'CapsLock': return modifiers.capsLock;
          case 'NumLock': return modifiers.numLock;
          default: return false;
        }
      };
      
      // Add standard DOM event methods
      (keyPressEvent as any).preventDefault = function() {
        this.returnValue = false;
      };
      
      (keyPressEvent as any).stopPropagation = function() {
        this._stopPropagation = true;
      };
      
      (keyPressEvent as any).stopImmediatePropagation = function() {
        this._stopImmediatePropagation = true;
        this._stopPropagation = true;
      };
      
      // Add legacy properties for backward compatibility (deprecated but still used)
      const keyCode = this.event.getLegacyKeyCode(key, code);
      
      // Implement charCode rule: only in keypress events, when key is printable AND on main keyboard, charCode=keyCode
      // Otherwise charCode should be 0
      let charCode = 0;
      if (key.length === 1 && this.keys.isMainKeyboardKey(virtualKey)) {
        // Only for printable characters on main keyboard: charCode = keyCode
        charCode = keyCode;
      }
      
      Object.defineProperty(keyPressEvent, 'keyCode', {
        value: keyCode,
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(keyPressEvent, 'charCode', {
        value: charCode, // keypress events: charCode=keyCode only for printable main keyboard keys
        writable: false,
        configurable: false
      });
      
      Object.defineProperty(keyPressEvent, 'which', {
        value: charCode || keyCode, // which is charCode for printable chars, keyCode otherwise
        writable: false,
        configurable: false
      });

      (keyPressEvent as any).isVirtualKeyboard = true;
      (keyPressEvent as any).virtualKeyElement = virtualKey;
      
      // Add timeStamp if not present (isTrusted is read-only and managed by browser)
      if (!keyPressEvent.timeStamp) {
        Object.defineProperty(keyPressEvent, 'timeStamp', {
          value: performance.now(),
          writable: false,
          configurable: false
        });
      }
      
      // Add inputType for input-related events (keyboard input)
      Object.defineProperty(keyPressEvent, 'inputType', {
        value: 'insertText',
        writable: false,
        configurable: false
      });
      
      // Set target to the currently focused element to match physical keyboard behavior
      // Virtual keyboard should not steal focus - events should go to the active element (maintain focus)
      const activeElement = this.editing.activeElement || document.activeElement || document.body;
      Object.defineProperty(keyPressEvent, 'target', {
        value: activeElement,
        writable: false
      });
      
      // Add event chain properties
      Object.defineProperty(keyPressEvent, 'currentTarget', {
        value: activeElement,
        writable: false
      });
      
      Object.defineProperty(keyPressEvent, 'eventPhase', {
        value: Event.BUBBLING_PHASE,
        writable: false
      });
      
      Object.defineProperty(keyPressEvent, 'defaultPrevented', {
        get: function() {
          return this.returnValue === false;
        },
        enumerable: true
      });
      
      // Dispatch from document to allow natural event flow for third-party listeners
      // This ensures the event goes through the complete capture-target-bubble phases
      document.dispatchEvent(keyPressEvent);
    },

    // Handle key click event (keyboard navigation with Enter/Space)
    handleKeyClick: (virtualKey: VirtualKey) => {
      // ====== Keyboard navigation mode - complete key sequence for all keys ======
      // This method is only called from keyboard navigation (Enter/Space), not mouse/touch events
      
      if (this.keys.isPhysicalToggleKey(virtualKey)) {
        // Physical toggle keys (Caps Lock, Num Lock): complete sequence
        this.keyDown(virtualKey);
        this.keyUp(virtualKey);
        
      } else if (this.keys.isModifierKey(virtualKey)) {
        // Modifier keys: toggle behavior for keyboard navigation
        const isCurrentlyPressed = this.state.isKeyDown(virtualKey);
        
        if (isCurrentlyPressed) {
          this.keyUp(virtualKey);
        } else {
          this.keyDown(virtualKey);
        }
        
      } else {
        // Regular keys: complete sequence for keyboard navigation
        this.keyDown(virtualKey);
        this.keyUp(virtualKey);
      }
    },

    // Dispatch a custom keyboard event
    dispatchCustomEvent: (type: string, data: any, target: EventTarget = window) => {
      const event = new CustomEvent(`virtual-keyboard-${type}`, {
        detail: data,
        bubbles: true,
        cancelable: true,
        composed: true
      });

      target.dispatchEvent(event);
    },

    // Add event listener for virtual keyboard events
    addEventListener: (type: string, listener: EventListener, target: EventTarget = window) => {
      target.addEventListener(`virtual-keyboard-${type}`, listener);
    },

    // Remove event listener for virtual keyboard events
    removeEventListener: (type: string, listener: EventListener, target: EventTarget = window) => {
      target.removeEventListener(`virtual-keyboard-${type}`, listener);
    }
  };

  disconnectedCallback() {
    // Clean up key repeat timers when keyboard is removed from DOM
    this.state.stopRepeat();
  }

  private render() {
    // Render basic keyboard structure without event listeners
    this.innerHTML = `
      <div class="virtual-keyboard-container">
        <div class="keyboard-layout">
          ${this.innerHTML}
        </div>
      </div>
    `;
  }

  // Initialize focus management system
  private initializeFocusManagement() {
    // Store reference to the editing object for easier access
    this.editing = this.editing;
  }

  // Setup focus listeners for input elements
  private setupFocusListeners() {
    // Listen for focus events on the document
    document.addEventListener('focus', (event) => {
      const target = event.target as HTMLElement;
      if (this.isEditableElement(target)) {
        this.editing.activeElement = target;
        this.setupKeyboardListeners(target);
      }
    }, true);

    // Listen for blur events to clear active editing element
    document.addEventListener('blur', (event) => {
      const target = event.target as HTMLElement;
      if (target === this.editing.activeElement) {
        this.removeKeyboardListeners();
        this.editing.activeElement = null;
      }
    }, true);
  }

  // Manage keyboard event listeners for the active element
  private keyboardEventListeners = {
    keydown: (event: KeyboardEvent) => {
      // Keyboard event handling (logging removed)
    },
    keyup: (event: KeyboardEvent) => {
      // Keyboard event handling (logging removed)
    },
    keypress: (event: KeyboardEvent) => {
      // Keyboard event handling (logging removed)
    }
  };

  // Setup keyboard event listeners on the active element
  private setupKeyboardListeners(element: HTMLElement) {
    // Remove listeners from previous element if any
    this.removeKeyboardListeners();
    
    if (element) {
      element.addEventListener('keydown', this.keyboardEventListeners.keydown);
      element.addEventListener('keyup', this.keyboardEventListeners.keyup);
      element.addEventListener('keypress', this.keyboardEventListeners.keypress);
    }
  }

  // Remove keyboard event listeners from the current element
  private removeKeyboardListeners() {
    const currentElement = this.editing.activeElement;
    if (currentElement) {
      currentElement.removeEventListener('keydown', this.keyboardEventListeners.keydown);
      currentElement.removeEventListener('keyup', this.keyboardEventListeners.keyup);
      currentElement.removeEventListener('keypress', this.keyboardEventListeners.keypress);
    }
  }

  // Initialize NumLock state to OFF by default
  private initializeNumLockState() {
    // NumLock should be OFF by default (like real keyboards)
    // This means numpad keys will produce navigation keys instead of numbers
    const numLockKey = this.keys.findByCode('NumLock');
    if (numLockKey) {
      // Don't add NumLock to active keys initially, so it starts as OFF
      // The visual state will be handled by the CSS and visual effects
    }
  }

  // Check if an element is editable
  private isEditableElement(element: HTMLElement): boolean {
    return element instanceof HTMLInputElement || 
           element instanceof HTMLTextAreaElement || 
           element.isContentEditable;
  }

  // Public property to// Check if current element is editable
  public get isElementEditable(): boolean {
    return this.editing.activeElement !== null;
  }

  // Get the current active editing element
  public get activeElement(): HTMLElement | null {
    return this.editing.activeElement;
  }

  // Set the active editing element with proper listener management
  public set activeElement(element: HTMLElement | null) {
    this.setActiveElement(element);
  }

  // Manually set the active editing element
  public setActiveElement(element: HTMLElement | null) { 
    if (element === null || this.isEditableElement(element)) {
      // Remove listeners from previous element
      this.removeKeyboardListeners();
      
      this.editing.activeElement = element;
      
      // Add listeners to new element
      if (element) {
        this.setupKeyboardListeners(element);
        element.focus();
      }
    }
  }


  // Direct visual effect calls - legacy redirect removed for cleanup

  editing = {
    // Currently focused input element for text editing
    activeElement: null as HTMLElement | null,

    // Insert text at current cursor position
    insertText(text: string) {
      if (!this.activeElement) return;

      const element = this.activeElement;
      
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // Check if the input element supports text selection
        const supportsSelection = element instanceof HTMLTextAreaElement || 
          (element instanceof HTMLInputElement && 
           ['text', 'password', 'search', 'url', 'tel', 'email', 'number'].includes(element.type));
        
        if (!supportsSelection) {
          // For non-text inputs (like checkboxes, radio buttons, etc.), just focus and return
          element.focus();
          return;
        }
        
        const start = element.selectionStart ?? 0;
        const end = element.selectionEnd ?? 0;
        const value = element.value;
        
        // Insert text at cursor position
        const newValue = value.substring(0, start) + text + value.substring(end);
        element.value = newValue;
        
        // Move cursor to after inserted text
        const newCursorPos = start + text.length;
        element.setSelectionRange(newCursorPos, newCursorPos);
        
        // Trigger input event for reactive frameworks
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (element.isContentEditable) {
        const selection = window.getSelection();
        if (!selection) return;
        
        // Get current range or create one
        let range = selection.getRangeAt(0);
        if (!range) {
          range = document.createRange();
          range.selectNodeContents(element);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // Delete selected content if any
        range.deleteContents();
        
        // Insert text at cursor position
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor to after inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Focus the element to ensure cursor is visible
      element.focus();
    },

    // Remove character before cursor (backspace functionality)
    backspace() {
      if (!this.activeElement) return;

      const element = this.activeElement;
      
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // Check if the input element supports text selection
        const supportsSelection = element instanceof HTMLTextAreaElement || 
          (element instanceof HTMLInputElement && 
           ['text', 'password', 'search', 'url', 'tel', 'email', 'number'].includes(element.type));
        
        if (!supportsSelection) {
          // For non-text inputs, just focus and return
          element.focus();
          return;
        }
        
        const start = element.selectionStart ?? 0;
        const end = element.selectionEnd ?? 0;
        
        if (start === end) {
          // No selection, delete character before cursor
          if (start > 0) {
            const value = element.value;
            const newValue = value.substring(0, start - 1) + value.substring(start);
            element.value = newValue;
            element.setSelectionRange(start - 1, start - 1);
          }
        } else {
          // Has selection, delete selected text
          const value = element.value;
          const newValue = value.substring(0, start) + value.substring(end);
          element.value = newValue;
          element.setSelectionRange(start, start);
        }
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (element.isContentEditable) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        if (range.collapsed) {
          // No selection, delete character before cursor
          if (range.startOffset > 0) {
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
              const text = textNode.textContent || '';
              const newText = text.substring(0, range.startOffset - 1) + text.substring(range.startOffset);
              textNode.textContent = newText;
              range.setStart(textNode, range.startOffset - 1);
              range.setEnd(textNode, range.startOffset - 1);
            }
          }
        } else {
          // Has selection, delete selected text
          range.deleteContents();
        }
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      element.focus();
    },

    // Remove character after cursor (delete functionality)
    delete() {
      if (!this.activeElement) return;

      const element = this.activeElement;
      
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        const start = element.selectionStart ?? 0;
        const end = element.selectionEnd ?? 0;
        
        if (start === end) {
          // No selection, delete character after cursor
          const value = element.value;
          if (start < value.length) {
            const newValue = value.substring(0, start) + value.substring(start + 1);
            element.value = newValue;
            element.setSelectionRange(start, start);
          }
        } else {
          // Has selection, delete selected text
          const value = element.value;
          const newValue = value.substring(0, start) + value.substring(end);
          element.value = newValue;
          element.setSelectionRange(start, start);
        }
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (element.isContentEditable) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        
        if (range.collapsed) {
          // No selection, delete character after cursor
          const textNode = range.startContainer;
          if (textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.textContent || '';
            if (range.startOffset < text.length) {
              const newText = text.substring(0, range.startOffset) + text.substring(range.startOffset + 1);
              textNode.textContent = newText;
              range.setStart(textNode, range.startOffset);
              range.setEnd(textNode, range.startOffset);
            }
          }
        } else {
          // Has selection, delete selected text
          range.deleteContents();
        }
        
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      element.focus();
    },

    // Insert newline character at cursor position
    enter() {
      if (!this.activeElement) return;

      const element = this.activeElement;
      
      if (element instanceof HTMLInputElement) {
        // For input elements, insert newline might not be appropriate
        // but we'll handle it by moving to next field or similar behavior
        this.insertText('\n');
      } else if (element instanceof HTMLTextAreaElement) {
        this.insertText('\n');
      } else if (element.isContentEditable) {
        this.insertText('\n');
      }
    },

    // Move cursor position by specified steps
    moveCursor(step: number) {
      const el = this.activeElement;
      if (!el) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const newPos = Math.max(0, Math.min(el.value.length, start + step));
        el.setSelectionRange(newPos, newPos);
      } else if (el.isContentEditable) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const textLength = textNode.textContent?.length ?? 0;
          const newOffset = Math.max(0, Math.min(textLength, range.startOffset + step));
          range.setStart(textNode, newOffset);
          range.setEnd(textNode, newOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    },

    // New: Move cursor vertically (in text areas)
    moveCursorVertical(lines: number) {
      const el = this.activeElement;
      if (!el) return;

      if (el instanceof HTMLTextAreaElement) {
        const start = el.selectionStart ?? 0;
        const value = el.value;
        const linesArr = value.split('\n');
        let pos = 0;
        let currentLine = 0;
        let currentCol = 0;

        // Calculate current line and column
        for (let i = 0; i < linesArr.length; i++) {
          const lineLen = linesArr[i].length + 1; // Include newline character
          if (pos + lineLen > start) {
            currentLine = i;
            currentCol = start - pos;
            break;
          }
          pos += lineLen;
        }

        // Calculate new line
        const newLine = Math.max(0, Math.min(linesArr.length - 1, currentLine + lines));
        const newLineText = linesArr[newLine] || '';
        const newCol = Math.min(newLineText.length, currentCol);
        let newPos = 0;
        for (let i = 0; i < newLine; i++) {
          newPos += linesArr[i].length + 1;
        }
        newPos += newCol;

        el.setSelectionRange(newPos, newPos);
      }
      // For input and contentEditable, vertical movement is not handled for now
    },

    // New: move to line start
    moveCursorToLineStart() {
      const el = this.activeElement;
      if (!el) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const value = el.value;
        const start = el.selectionStart ?? 0;
        
        // Find current line start position
        let lineStart = 0;
        for (let i = start - 1; i >= 0; i--) {
          if (value[i] === '\n') {
            lineStart = i + 1;
            break;
          }
        }
        
        el.setSelectionRange(lineStart, lineStart);
      } else if (el.isContentEditable) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        
        // Create new range, move to current line start
        const newRange = range.cloneRange();
        newRange.collapse(true);
        
        // Find line start (simplified: find nearest text node start)
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          newRange.setStart(textNode, 0);
          newRange.setEnd(textNode, 0);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    },

    // New: move to line end
    moveCursorToLineEnd() {
      const el = this.activeElement;
      if (!el) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const value = el.value;
        const start = el.selectionStart ?? 0;
        
        // Find current line end position
        let lineEnd = value.length;
        for (let i = start; i < value.length; i++) {
          if (value[i] === '\n') {
            lineEnd = i;
            break;
          }
        }
        
        el.setSelectionRange(lineEnd, lineEnd);
      } else if (el.isContentEditable) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        
        // Create new range, move to current line end
        const newRange = range.cloneRange();
        newRange.collapse(true);
        
        // Find line end (simplified: find nearest text node end)
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          const textLength = textNode.textContent?.length ?? 0;
          newRange.setStart(textNode, textLength);
          newRange.setEnd(textNode, textLength);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    },

    // New: copy selected text to clipboard
    async copy() {
      const el = this.activeElement;
      if (!el) return false;

      try {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const start = el.selectionStart ?? 0;
          const end = el.selectionEnd ?? 0;
          
          if (start !== end) {
            const selectedText = el.value.substring(start, end);
            await navigator.clipboard.writeText(selectedText);
            return true;
          }
        } else if (el.isContentEditable) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString();
            if (selectedText) {
              await navigator.clipboard.writeText(selectedText);
              return true;
            }
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Copy operation failed. Please check clipboard permissions.', error);
      }
      return false;
    },

    // New: paste text from clipboard
    async paste() {
      const el = this.activeElement;
      if (!el) return false;

      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          this.insertText(text);
          return true;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Paste operation failed. Please check clipboard permissions.', error);
      }
      return false;
    },

    // New: cut selected text to clipboard
    async cut() {
      const el = this.activeElement;
      if (!el) return false;

      const copied = await this.copy();
      if (copied) {
        // If copy succeeds, delete selected text
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const start = el.selectionStart ?? 0;
          const end = el.selectionEnd ?? 0;
          
          if (start !== end) {
            const value = el.value;
            const newValue = value.substring(0, start) + value.substring(end);
            el.value = newValue;
            el.setSelectionRange(start, start);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.focus();
          }
        } else if (el.isContentEditable) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
              range.deleteContents();
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.focus();
            }
          }
        }
        return true;
      }
      return false;
    },

    // New: select all text
    selectAll() {
      const el = this.activeElement;
      if (!el) return false;

      try {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.setSelectionRange(0, el.value.length);
        } else if (el.isContentEditable) {
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(el);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        el.focus();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Select all operation failed.', error);
        return false;
      }
    }
  };

  // Key management methods
  isToggleKey(virtualKey: VirtualKey): boolean {
    return this.keys.isToggleKey(virtualKey);
  }

  // Key state management methods
  isModifierKey(virtualKey: VirtualKey): boolean {
    return this.keys.isModifierKey(virtualKey);
  }

  // Handle key click event (both down and up)
  handleKeyClick(virtualKey: VirtualKey) {
    this.event.handleKeyClick(virtualKey);
  }

  /**
   * Find virtual-key element by code attribute
   * @param code - The code attribute value to search for
   * @returns Matching virtual-key element, or null if not found
   */
  getVirtualKeyByCode(code: string): VirtualKey | null {
    return this.keys.findByCode(code);
  }





  // New key state management system for better key repeat support
  keyState = {
    // Initial key down - handles state setup and initial event
    initialKeyDown: (virtualKey: VirtualKey) => {
      
      // Handle modifier key toggle behavior
      if (this.keys.isModifierKey(virtualKey)) {
        const isCurrentlyPressed = this.state.isKeyDown(virtualKey);
        
        if (isCurrentlyPressed) {
          // Modifier key is already pressed - toggle it off
          this.keyUpModifierKey(virtualKey);
          return;
        }
        // Modifier key is not pressed - continue to press it
      }
      
      // Set key state to pressed
      this.setKeyState(virtualKey, true);
      
      // Apply visual effects (direct call, legacy redirect removed)
      this.visual.applyKeyDownEffect(virtualKey);
      
      // Dispatch keydown event
      this.event.dispatchKeyDown(virtualKey);
      
      // Dispatch keypress event for eligible keys (after keydown)
      this.event.dispatchKeyPress(virtualKey);
      
      // Start key repeat for normal keys only
      if (this.keys.isNormalKey(virtualKey)) {
        this.state.startRepeat(virtualKey);
      }
    },

    // Repeating key down - only sends events and handles text input, doesn't change state
    repeatingKeyDown: (virtualKey: VirtualKey) => {
      
      // For repeating keys, only dispatch event and handle text input
      // Don't change state or apply visual effects again
      this.event.dispatchKeyDown(virtualKey);
      
      // Handle text input for normal keys during repeat
      if (this.keys.isNormalKey(virtualKey)) {
        this.handleTextInput(virtualKey);
      }
    },

    // Key up - handles state cleanup and final event
    keyUp: (virtualKey: VirtualKey) => {
      
      // Only process if key is actually down
      if (!this.state.isKeyDown(virtualKey)) {
        return;
      }
      
      // Stop key repeat if this key was being repeated (before changing state)
      if (this.state.repeatKey === virtualKey) {
        this.state.stopRepeat();
      }
      
      // Modifier keys should NOT be released on mouseup - they stay pressed
      if (this.keys.isModifierKey(virtualKey)) {
        // Do nothing - modifier keys stay pressed until explicitly toggled or auto-released
        return;
      }
      
      // Handle normal keys and toggle keys
      this.setKeyState(virtualKey, false);
      
      // Apply visual effects (direct call, legacy redirect removed)
      this.visual.applyKeyUpEffect(virtualKey);
      
      // Dispatch keyup event
      this.event.dispatchKeyUp(virtualKey);
      
      // Handle text input for normal keys
      if (this.keys.isNormalKey(virtualKey)) {
        this.handleTextInput(virtualKey);
        
        // Auto-keyUp modifier keys after text input is handled
        // This ensures modifier states are consistent between keydown and keyup
        // Only keyUp modifier keys that are currently in keydown state
        this.keyUpAllModifiers();
      }
    }
  };

  // Set key state (pressed/released) with proper categorization
  private setKeyState(virtualKey: VirtualKey, isPressed: boolean) {
    const code = virtualKey.getAttribute('code') || '';
    
    if (isPressed) {
      // Add to active keys
      this.state.addKeyDownKey(virtualKey);
      
      // Handle modifier keys
      if (code.startsWith('Shift')) {
        this.state.addModifier('Shift');
      } else if (code.startsWith('Control')) {
        this.state.addModifier('Control');
      } else if (code.startsWith('Alt')) {
        this.state.addModifier('Alt');
      } else if (code.startsWith('Meta')) {
        this.state.addModifier('Meta');
      }
      
      // Handle physical toggle keys
      if (this.keys.isPhysicalToggleKey(virtualKey)) {
        const toggleCode = code === 'CapsLock' ? 'CapsLock' : 'NumLock';
        const currentState = this.state.getToggleState(toggleCode);
        this.state.setToggleState(toggleCode, !currentState);
        
        // Apply visual effects for toggle keys (direct calls)
        if (code === 'CapsLock') {
          this.visual.applyCapsLockVisualEffect(!currentState);
        } else if (code === 'NumLock') {
          this.visual.applyNumLockVisualEffect(!currentState);
        }
      }
      
      // Handle modifier toggle state (for modifier keys only)
      if (this.keys.isModifierKey(virtualKey)) {
        const currentState = this.state.getToggleState(code);
        this.state.setToggleState(code, !currentState);
      }
    } else {
      // Remove from keyDown keys
      this.state.removeKeyDownKey(virtualKey);
      
      // Only handle physical toggle keys and normal keys keyUp
      // Modifier keys should maintain their state until explicitly toggled
      if (this.keys.isPhysicalToggleKey(virtualKey)) {
        // Physical toggle keys don't need special handling on release
        // Their state is managed by the toggle state system
      } else if (this.keys.isNormalKey(virtualKey)) {
        // Normal keys don't need special handling on release
      }
      // Note: Modifier keys are NOT handled here to prevent automatic keyUp
      // They should only be keyUp when explicitly toggled via keyUp
    }
  }

  // Handle key press down - main API for VirtualKey elements
  keyDown(virtualKey: VirtualKey) {
    this.keyState.initialKeyDown(virtualKey);
  }

  // Handle key release - main API for VirtualKey elements
  keyUp(virtualKey: VirtualKey) {
    this.keyState.keyUp(virtualKey);
  }

  // Automatically keyUp all pressed modifier keys (ctrl, shift, alt, meta only)
  private keyUpAllModifiers() {
    const modifierCodes = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'];
    
    const beforeModifiers = this.state.getKeyDownModifiers();
    
    // Only release modifier keys that are currently in keydown state
    let releasedCount = 0;
    for (const code of modifierCodes) {
      const modifierKey = this.keys.findByCode(code);
      if (modifierKey && this.state.isKeyDown(modifierKey)) {
        // Reset toggle state for this modifier
        this.state.setToggleState(code, false);
        
        // Remove from key down state
        this.state.removeKeyDownKey(modifierKey);
        
        // Remove from modifier set
        const modifierType = code.replace(/Left|Right$/, '');
        this.state.removeModifier(modifierType);
        
        releasedCount++;
        
        // Apply visual effects (direct call, legacy redirect removed)
      this.visual.applyKeyUpEffect(modifierKey);
        
        // Dispatch event
        this.event.dispatchKeyUp(modifierKey);
      }
    }
    
    const afterModifiers = this.state.getKeyDownModifiers();
  }

  // KeyUp a single modifier key
  private keyUpModifierKey(virtualKey: VirtualKey) {
    const code = virtualKey.getAttribute('code') || '';
    
    // Reset toggle state for this modifier
    this.state.setToggleState(code, false);
    
    // Remove from key down state
    this.state.removeKeyDownKey(virtualKey);
    
    // Remove from modifier set
    if (code.startsWith('Shift')) {
      this.state.removeModifier('Shift');
    } else if (code.startsWith('Control')) {
      this.state.removeModifier('Control');
    } else if (code.startsWith('Alt')) {
      this.state.removeModifier('Alt');
    } else if (code.startsWith('Meta')) {
      this.state.removeModifier('Meta');
    }
    
    // Apply visual effects
    this.visual.applyKeyUpEffect(virtualKey);
    
    // Dispatch event
    this.event.dispatchKeyUp(virtualKey);
  }

  // Handle text input based on key type
  private handleTextInput(virtualKey: VirtualKey) {
    const code = virtualKey.getAttribute('code') || '';
    const key = virtualKey.getAttribute('key') || virtualKey.getAttribute('label') || '';
    
    // Skip if no active editing element
    if (!this.activeElement) {
      return;
    }

    // Get current modifier states
    const modifiers = this.state.getModifierStates();
    
    // Handle Ctrl+C/V/X/A shortcuts
    if (modifiers.ctrl && !modifiers.alt && !modifiers.meta) {
      if (code === 'KeyC') {
        // Ctrl+C: Copy
        this.editing.copy();
        return;
      } else if (code === 'KeyV') {
        // Ctrl+V: Paste
        this.editing.paste();
        return;
      } else if (code === 'KeyX') {
        // Ctrl+X: Cut
        this.editing.cut();
        return;
      } else if (code === 'KeyA') {
        // Ctrl+A: Select All
        this.editing.selectAll();
        return;
      }
    }
    
    // Skip text input if there are any modifiers (Ctrl, Alt, Meta) except for handled shortcuts
    // This prevents editing object calls when modifier keys are active during normal key presses
    if (modifiers.ctrl || modifiers.alt || modifiers.meta) {
      return;
    }

    // Handle different types of keys
      if (code.startsWith('Key')) {
        // Letter keys - apply modifier transformations
      const finalChar = this.applyModifierTransformations(key);
      this.editing.insertText(finalChar);
      } else if (code.startsWith('Digit')) {
        // Number keys - use shift-text when Shift is pressed
        let finalChar = key;
        if (modifiers.shift) {
          // Get shift-text for number keys when Shift is pressed
          const shiftKey = virtualKey.getAttribute('shift-key') || '';
          const shiftCode = virtualKey.getAttribute('shift-code') || '';
          finalChar = shiftKey || shiftCode || key;
        }
        this.editing.insertText(finalChar);
      } else if (code === 'Space') {
        // Space key
        this.editing.insertText(' ');
      } else if (code === 'Enter' || code === 'NumpadEnter') {
        // Enter key
        this.editing.enter();
      } else if (code === 'Backspace') {
        // Backspace key
        this.editing.backspace();
      } else if (code === 'Delete') {
        // Delete key
        this.editing.delete();
      } else if (code === 'ArrowLeft') {
        // Left arrow key
        this.editing.moveCursor(-1);
      } else if (code === 'ArrowRight') {
        // Right arrow key
        this.editing.moveCursor(1);
      } else if (code === 'ArrowUp') {
        // Up arrow key
        this.editing.moveCursorVertical(-1);
      } else if (code === 'ArrowDown') {
        // Down arrow key
        this.editing.moveCursorVertical(1);
      } else if (code === 'Home') {
        // Home key: move cursor to beginning of line
        this.editing.moveCursorToLineStart();
      } else if (code === 'End') {
        // End key: move cursor to end of line
        this.editing.moveCursorToLineEnd();
      } else if (code === 'PageUp') {
        // PageUp key: move cursor up 4 lines and to end of line
        // If moving to first line, move to beginning of line instead
        this.editing.moveCursorVertical(-4);
        // Check if on first line, move to line start if so, otherwise move to line end
        const el = this.editing.activeElement;
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const value = el.value;
          const start = el.selectionStart ?? 0;
          
          // Calculate current line number
          let currentLine = 0;
          let pos = 0;
          const lines = value.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (pos + lines[i].length + (i > 0 ? 1 : 0) > start) {
              currentLine = i;
              break;
            }
            pos += lines[i].length + 1;
          }
          
          // If on first line, move to line start, otherwise move to line end
          if (currentLine === 0) {
            // Find current line start position
            let lineStart = 0;
            for (let i = start - 1; i >= 0; i--) {
              if (value[i] === '\n') {
                lineStart = i + 1;
                break;
              }
            }
            el.setSelectionRange(lineStart, lineStart);
          } else {
            // Find current line end position
            let lineEnd = value.length;
            for (let i = start; i < value.length; i++) {
              if (value[i] === '\n') {
                lineEnd = i;
                break;
              }
            }
            el.setSelectionRange(lineEnd, lineEnd);
          }
        } else if (el?.isContentEditable) {
          // For contentEditable, simplified handling: always move to line end
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
              const textLength = textNode.textContent?.length ?? 0;
              const newRange = range.cloneRange();
              newRange.setStart(textNode, textLength);
              newRange.setEnd(textNode, textLength);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
      } else if (code === 'PageDown') {
        // PageDown key: move cursor down 4 lines and to end of line
        this.editing.moveCursorVertical(4);
        this.editing.moveCursorToLineEnd();
      } else if (code.startsWith('Numpad') && code !== 'NumpadEnter') {
        // Numpad keys (numbers and operations)
      const numpadValue = this.getNumpadValue(code, key);
      if (numpadValue) {
        // Handle navigation key functions when NumLock is off - trigger corresponding actions directly, reuse main keyboard logic
        if (numpadValue === 'ArrowLeft') {
          this.editing.moveCursor(-1);
        } else if (numpadValue === 'ArrowRight') {
          this.editing.moveCursor(1);
        } else if (numpadValue === 'ArrowUp') {
          this.editing.moveCursorVertical(-1);
        } else if (numpadValue === 'ArrowDown') {
          this.editing.moveCursorVertical(1);
        } else if (numpadValue === 'Home') {
          // Numpad Home key: move to line start (reuse main keyboard logic)
          this.editing.moveCursorToLineStart();
        } else if (numpadValue === 'End') {
          // Numpad End key: move to line end (reuse main keyboard logic)
          this.editing.moveCursorToLineEnd();
        } else if (numpadValue === 'PageUp') {
          // Numpad PageUp key: move up 4 lines, line start if first line (reuse main keyboard logic)
          this.editing.moveCursorVertical(-4);
          // Check if on first line, move to line start if so, otherwise move to line end
          const el = this.activeElement;
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const value = el.value;
            const start = el.selectionStart ?? 0;
            
            // Calculate current line number
            let currentLine = 0;
            let pos = 0;
            const lines = value.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (pos + lines[i].length + (i > 0 ? 1 : 0) > start) {
                currentLine = i;
                break;
              }
              pos += lines[i].length + 1;
            }
            
            // If on first line, move to line start, otherwise move to line end
            if (currentLine === 0) {
              // Find current line start position
              let lineStart = 0;
              for (let i = start - 1; i >= 0; i--) {
                if (value[i] === '\n') {
                  lineStart = i + 1;
                  break;
                }
              }
              el.setSelectionRange(lineStart, lineStart);
            } else {
              // Find current line end position
              let lineEnd = value.length;
              for (let i = start; i < value.length; i++) {
                if (value[i] === '\n') {
                  lineEnd = i;
                  break;
                }
              }
              el.setSelectionRange(lineEnd, lineEnd);
            }
          } else if (el?.isContentEditable) {
            // For contentEditable, simplified handling: always move to line end
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const textNode = range.startContainer;
              if (textNode.nodeType === Node.TEXT_NODE) {
                const textLength = textNode.textContent?.length ?? 0;
                const newRange = range.cloneRange();
                newRange.setStart(textNode, textLength);
                newRange.setEnd(textNode, textLength);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          }
        } else if (numpadValue === 'PageDown') {
          // Numpad PageDown key: move down 4 lines and move to line end (reuse main keyboard logic)
          this.editing.moveCursorVertical(4);
          this.editing.moveCursorToLineEnd();
        } else if (numpadValue === 'Insert') {
          // Numpad Insert key: no operation (meaningless in input box)
          // Do nothing to avoid inserting "Insert" text
        } else if (numpadValue === 'Delete') {
          // Numpad Delete key: perform delete operation (reuse main keyboard logic)
          this.editing.delete();
        } else {
          // Numbers and operators, insert text directly
          this.editing.insertText(numpadValue);
        }
      }
      } else if (key.length === 1) {
        // Single character keys (punctuation, etc.)
        let finalChar = key;
        
        // For non-letter single characters in shift state, use the key's own shift-key attribute
        if (modifiers.shift && !key.match(/[a-zA-Z]/)) {
          const shiftKey = virtualKey.getAttribute('shift-key') || '';
          const shiftCode = virtualKey.getAttribute('shift-code') || '';
          finalChar = shiftKey || shiftCode || key;
        } else {
          // Apply modifier transformations for other cases
          finalChar = this.applyModifierTransformations(key);
        }
        
        this.editing.insertText(finalChar);
      }
  }

  // Get the actual character value for numpad keys
  private getNumpadValue(code: string, key: string): string | null {
    const numLockState = this.state.getToggleState('NumLock');
    
    // When NumLock is off, number keys produce navigation keys
    if (!numLockState && code.match(/Numpad[0-9]/)) {
      const navMap: { [key: string]: string } = {
        'Numpad0': 'Insert',
        'Numpad1': 'End',
        'Numpad2': 'ArrowDown',
        'Numpad3': 'PageDown',
        'Numpad4': 'ArrowLeft',
        'Numpad5': 'Clear',
        'Numpad6': 'ArrowRight',
        'Numpad7': 'Home',
        'Numpad8': 'ArrowUp',
        'Numpad9': 'PageUp'
      };
      return navMap[code] || key;
    }
    
    // When NumLock is on, or non-number keys, use normal mapping
    const numpadMap: { [key: string]: string } = {
      'Numpad0': '0',
      'Numpad1': '1',
      'Numpad2': '2',
      'Numpad3': '3',
      'Numpad4': '4',
      'Numpad5': '5',
      'Numpad6': '6',
      'Numpad7': '7',
      'Numpad8': '8',
      'Numpad9': '9',
      'NumpadAdd': '+',
      'NumpadSubtract': '-',
      'NumpadMultiply': '*',
      'NumpadDivide': '/',
      'NumpadDecimal': '.',
      'NumpadEqual': '='
    };
    
    return numpadMap[code] || key;
  }

  // Get the value of a key based on current state
  getKeyValue(virtualKey: VirtualKey): string {
    const code = virtualKey.getAttribute('code') || '';
    const value = virtualKey.getAttribute('value') || '';
    const key = virtualKey.getAttribute('key') || '';
    
    // Handle special keys
    if (code === 'Enter') return 'Enter';
    if (code === 'Tab') return 'Tab';
    if (code === 'Space') return ' ';
    if (code === 'Backspace') return 'Backspace';
    if (code === 'Delete') return 'Delete';
    
    // Handle numpad keys
    if (code.startsWith('Numpad')) {
      const numpadValue = this.getNumpadValue(code, key);
      return numpadValue || value;
    }
    
    // Handle NumLock state for numpad
    if (code.startsWith('Numpad') && !this.state.getToggleState('NumLock')) {
      const numpadValue = this.getNumpadValue(code, key);
      return numpadValue || value;
    }
    
    // Apply modifier transformations
    return this.applyModifierTransformations(value);
  }

  // Apply modifier transformations to text
  applyModifierTransformations(text: string): string {
    const modifiers = this.state.getModifierStates();
    let transformed = text;
    
    // Handle letter keys' Caps Lock and Shift combination effects
    if (transformed.length === 1 && transformed.match(/[a-zA-Z]/)) {
      // Caps Lock and Shift combination logic:
        // - Only Caps Lock: uppercase
        // - Only Shift: uppercase  
        // - Caps Lock + Shift: lowercase (cancel each other out)
      if (modifiers.capsLock && modifiers.shift) {
        transformed = transformed.toLowerCase();
      } else if (modifiers.capsLock || modifiers.shift) {
        transformed = transformed.toUpperCase();
      }
    }
    // For non-letter keys, rely on VirtualKey element's own shift-key attributes
    // The HTML template already defines the correct shift characters
    
    return transformed;
  }



  // Event management methods
  triggerKeyUpEvent(virtualKey: VirtualKey) {
    this.event.dispatchKeyUp(virtualKey);
  }

  // Event dispatch methods
  triggerKeyDownEvent(virtualKey: VirtualKey) {
    this.event.dispatchKeyDown(virtualKey);
    
    // Also trigger keypress for character-producing keys
    const code = virtualKey.getAttribute('code') || '';
    if (this.shouldTriggerKeypress(code)) {
      this.triggerKeyPressEvent(virtualKey);
    }
  }
  
  // Helper method to determine if keypress should be triggered
  private shouldTriggerKeypress(code: string): boolean {
    // Don't trigger keypress for modifier keys, navigation keys, and function keys
    const skipCodes = [
      'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight',
      'CapsLock', 'NumLock', 'ScrollLock',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 
      'Insert', 'Delete', 'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 
      'F10', 'F11', 'F12'
    ];
    return !skipCodes.includes(code);
  }
  
  // Helper method to get modifier string (c,a,s format)
  private getModifierString(modifiers: any): string {
    let modStr = '';
    if (modifiers.ctrl) modStr += 'c';
    if (modifiers.alt) modStr += 'a';
    if (modifiers.shift) modStr += 's';
    if (modifiers.meta) modStr += 'm';
    return modStr || 'none';
  }
  
  // Trigger keypress event
  triggerKeyPressEvent(virtualKey: VirtualKey) {
    this.event.dispatchKeyPress(virtualKey);
  }

}

// Define custom element for virtual keyboard
customElements.define('virtual-keyboard', VirtualKeyboard);