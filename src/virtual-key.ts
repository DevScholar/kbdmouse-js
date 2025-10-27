import { VirtualKeyboard } from "./virtual-keyboard.js";

// Debug configuration for console logging
interface DebugConfig {
  enabled: boolean;
  showConsole: boolean;
}

const debug: DebugConfig = {
  enabled: false,
  showConsole: true
};

export class VirtualKey extends HTMLElement {
  private mousedownHandler!: (e: Event) => void;
  private mouseupHandler!: (e: Event) => void;
  private mouseleaveHandler!: (e: Event) => void;
  private touchstartHandler!: (e: Event) => void;
  private touchendHandler!: (e: Event) => void;
  private touchcancelHandler!: (e: Event) => void;
  private clickHandler!: (e: Event) => void;

  constructor() {
    super();
    
    // Use optional chaining operator and modern syntax
    this.mousedownHandler = (e: Event) => {
      e.preventDefault();
      this.parentKeyboard?.keyDown(this);
    };
    
    this.mouseupHandler = (e: Event) => {
      e.preventDefault();
      this.parentKeyboard?.keyUp(this);
    };
    
    this.mouseleaveHandler = (e: Event) => {
      // For normal keys (non-modifier, non-toggle), auto-release on mouseleave to stop repeat
      const keyboard = this.parentKeyboard;
      if (keyboard?.keys.isNormalKey(this)) {
        if (keyboard.state.isKeyDown(this) && keyboard.state.repeatKey === this) {
          keyboard.keyUp(this);
        }
      }
      // Only prevent default to avoid text selection
      e.preventDefault();
    };
    
    this.touchstartHandler = (e: Event) => {
      e.preventDefault();
      this.parentKeyboard?.keyDown(this);
    };
    
    this.touchendHandler = (e: Event) => {
      e.preventDefault();
      this.parentKeyboard?.keyUp(this);
    };
    
    this.touchcancelHandler = (e: Event) => {
      this.parentKeyboard?.state.isKeyDown(this) && this.parentKeyboard?.keyUp(this);
    };
    
    this.clickHandler = (e: Event) => {
      e.preventDefault();
    };
  }

  connectedCallback() {
    this.render();

    // Add ARIA button attributes
    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', '0');
    this.setAttribute('aria-pressed', 'false');
    
    // Set accessible name
    const label = this.getAttribute('label') || this.getAttribute('key') || this.getAttribute('code') || '';
    if (label) {
      this.setAttribute('aria-label', label);
    }

    // Add keyboard event support
    this.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.parentKeyboard?.handleKeyClick(this);
      }
    });

    // Click event is now handled by mouse/touch events for better control

    // Add mouse/touch event listeners for key repeat
    this.addEventListener('mousedown', this.mousedownHandler);
    this.addEventListener('mouseup', this.mouseupHandler);
    this.addEventListener('mouseleave', this.mouseleaveHandler);

    // Touch events for mobile
    this.addEventListener('touchstart', this.touchstartHandler);
    this.addEventListener('touchend', this.touchendHandler);
    this.addEventListener('touchcancel', this.touchcancelHandler);

    // Prevent default click behavior in order to keep the focus on previous focused element
    this.addEventListener('click', this.clickHandler);

    // Monitor attribute changes and re-render
    const observer = new MutationObserver(() => {
      this.render();
    });

    observer.observe(this, {
      attributes: true,
      attributeFilter: ['label', 'key', 'code', 'shift-key', 'shift-code']
    });
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.removeEventListener('click', this.clickHandler);
    this.removeEventListener('mousedown', this.mousedownHandler);
    this.removeEventListener('mouseup', this.mouseupHandler);
    this.removeEventListener('mouseleave', this.mouseleaveHandler);
    this.removeEventListener('touchstart', this.touchstartHandler);
    this.removeEventListener('touchend', this.touchendHandler);
    this.removeEventListener('touchcancel', this.touchcancelHandler);
  }

  get parentKeyboard(): VirtualKeyboard | null {
    // Use modern syntax and optional chaining
    const keyboard = this.closest('virtual-keyboard') as VirtualKeyboard | null;
    
    if (!keyboard) {
      const error = new Error('<virtual-keyboard> ancestor element not found');
      debug.showConsole && console.error(`[VirtualKey] Virtual key must be placed inside a virtual-keyboard element:`, error.message);
      throw error;
    }
    
    return keyboard;
  }

  private render() {
    const label = this.getAttribute('label') || '';
    const key = this.getAttribute('key') || '';
    const code = this.getAttribute('code') || '';

    // Get shift text (for display only)
    const shiftKey = this.getAttribute('shift-key') || '';
    const shiftCode = this.getAttribute('shift-code') || '';
    const shiftText = shiftKey || shiftCode;

    // Display text priority: label > key > code
    const displayText = label || key || code || '?';

    // Ensure innerHTML is correctly set
    const content = `
      ${shiftText ? `<div class="shift-text">${shiftText}</div>` : ''}
      <div class="main-text">${displayText}</div>
    `;

    if (this.innerHTML !== content) {
      this.innerHTML = content;
    }
  }
}

// Define custom element
customElements.define('virtual-key', VirtualKey);