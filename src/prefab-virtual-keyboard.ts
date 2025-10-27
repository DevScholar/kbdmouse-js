/**
 * HTML Transporter - PrefabVirtualKeyboard with auto-scaling functionality
 * Can calculate natural size and CSS-specified size, using scaleX and scaleY for automatic scaling
 */

// Import virtual keyboard modules directly
import { VirtualKeyboard } from './virtual-keyboard.js';
import { VirtualKey } from './virtual-key.js';

// Debug configuration for console logging
interface DebugConfig {
  enabled: boolean;
  showConsole: boolean;
}

const debug: DebugConfig = {
  enabled: false,
  showConsole: true
};

export class PrefabVirtualKeyboard extends HTMLElement {
  private isContentLoaded = false;
  private isLoading = false;
  private naturalWidth = 0;
  private naturalHeight = 0;
  private resizeObserver?: ResizeObserver;
  private shadowRootInstance: ShadowRoot | null = null;
  private shadowDomEnabled = true;

  constructor() {
    super();
    // Don't initialize shadow DOM here - wait for connectedCallback
    // This prevents issues with attribute changes during element creation
  }

  private initializeShadowDom() {
    const enableShadowDom = this.getAttribute('shadow-dom') !== 'false'; // Default to true
    this.shadowDomEnabled = enableShadowDom; // Track the state
    
    if (enableShadowDom) {
      // Only create shadow root if it doesn't already exist
      if (!this.shadowRoot) {
        this.shadowRootInstance = this.attachShadow({ mode: 'open' });
      } else {
        this.shadowRootInstance = this.shadowRoot;
      }
    } else {
      // When shadow DOM is disabled, don't create it
      this.shadowRootInstance = null;
    }
  }

  connectedCallback() {
    // Initialize shadow DOM when element is connected
    this.initializeShadowDom();
    
    this.loadContent();
    this.setupResizeObserver();
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  static get observedAttributes() {
    return ['keyboard-css-src', 'keyboard-html-src', 'width', 'height', 'shadow-dom'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
      if (name === 'width' || name === 'height') {
        this.applyScaling();
        this.updateResizeObserver();
      }
      else {
        this.loadContent();
      }
    }
  }

  private async loadContent() {
    // Prevent duplicate loading
    if (this.isContentLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const cssSrc = this.getAttribute('keyboard-css-src') || '';
    const htmlSrc = this.getAttribute('keyboard-html-src') || '';

    if (!htmlSrc) {
      const container = this.getContainer();
      if (container) {
        (container as HTMLElement).innerHTML = '<div style="color: red;">Error: keyboard-html-src attribute must be provided</div>';
      } else {
        this.innerHTML = '<div style="color: red;">Error: keyboard-html-src attribute must be provided</div>';
      }
      this.isLoading = false;
      return;
    }

    try {
      // Get the target container (shadow root or light DOM)
      const container = this.getContainer();
      
      // Clear existing content first
      if (this.shadowRootInstance) {
        this.shadowRootInstance.innerHTML = '';
      } else {
        // Clear light DOM content but preserve the element itself
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
      }
      
      // Load CSS and HTML in parallel
      const [cssContent, htmlContent] = await Promise.all([
        cssSrc ? this.fetchContent(cssSrc) : Promise.resolve(''),
        this.fetchContent(htmlSrc)
      ]);

      // Insert content based on DOM type
      if (this.shadowRootInstance) {
        // Shadow DOM - use style tag and ensure custom elements are defined
        this.shadowRootInstance.innerHTML = `
          <style>${cssContent}</style>
          ${htmlContent}
        `;
        
        // Define custom elements in shadow DOM context if not already defined
        this.defineCustomElementsInShadowDom();
      } else {
        // Light DOM - create style element and insert HTML
        if (container && container !== this) {
          // If we have a container that's not 'this', use it
          container.innerHTML = htmlContent;
          
          // Add CSS as a style element
          if (cssContent) {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            container.insertBefore(styleElement, container.firstChild);
          }
        } else {
          // If container is 'this' (the element itself), append children instead
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          
          // Append all children from the temp div
          while (tempDiv.firstChild) {
            this.appendChild(tempDiv.firstChild);
          }
          
          // Add CSS as a style element
          if (cssContent) {
            const styleElement = document.createElement('style');
            styleElement.textContent = cssContent;
            this.insertBefore(styleElement, this.firstChild);
          }
        }
      }

      this.isContentLoaded = true;
      this.isLoading = false;

      // Calculate natural size and apply scaling after content is loaded
      this.calculateNaturalSize();
      this.applyScaling();

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      if (debug.showConsole) {
        console.error(`[PrefabVirtualKeyboard] Failed to load virtual keyboard content:`, errorObj.message);
      }
      
      const container = this.getContainer();
      if (container) {
        container.innerHTML = `<div style="color: red;">Load failed: ${errorObj.message}</div>`;
      } else {
        this.innerHTML = `<div style="color: red;">Load failed: ${errorObj.message}</div>`;
      }
      this.isLoading = false;
    }
  }

  private defineCustomElementsInShadowDom() {
    // Define custom elements in the shadow DOM context
    if (this.shadowRootInstance) {
      // Check if elements are already defined to avoid re-definition errors
      if (!customElements.get('virtual-keyboard')) {
        customElements.define('virtual-keyboard', VirtualKeyboard);
      }
      if (!customElements.get('virtual-key')) {
        customElements.define('virtual-key', VirtualKey);
      }
    }
  }

  private async fetchContent(src: string): Promise<string> {
    // Handle data URLs
    if (src.startsWith('data:')) {
      return this.handleDataUrl(src);
    }
    
    // Handle blob URLs
    if (src.startsWith('blob:')) {
      return this.handleBlobUrl(src);
    }
    
    // Regular HTTP/HTTPS URLs
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }

  private handleDataUrl(dataUrl: string): string {
    try {
      // Parse data URL format: data:[<mediatype>][;base64],<data>
      const parts = dataUrl.split(',');
      if (parts.length < 2) {
        throw new Error('Invalid data URL format');
      }
      
      const header = parts[0];
      const data = parts.slice(1).join(','); // Handle commas in data
      
      // Check if it's base64 encoded
      if (header.includes(';base64')) {
        // Decode base64
        return atob(data);
      } else {
        // Plain text - decode URI component
        return decodeURIComponent(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to handle data URL: ${errorMessage}`);
    }
  }

  private async handleBlobUrl(blobUrl: string): Promise<string> {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to handle blob URL: ${errorMessage}`);
    }
  }

  private getContainer(): HTMLElement | ShadowRoot {
    return this.shadowRootInstance || this;
  }

  // Getter/setter for content access - encapsulates shadow DOM vs light DOM
  get contentContainer(): HTMLElement | ShadowRoot {
    return this.getContainer();
  }

  get contentRoot(): HTMLElement {
    return this as HTMLElement;
  }

  // Getter for shadow DOM status - this is what the test should check
  get isShadowDomEnabled(): boolean {
    return this.shadowDomEnabled;
  }

  // Method to check if shadow DOM is actually active (has shadow root and is enabled)
  get hasActiveShadowRoot(): boolean {
    return this.shadowDomEnabled && !!this.shadowRoot;
  }

  // Setter for shadow DOM - properly handles enable/disable
  setShadowDomEnabled(enabled: boolean): void {
    this.setAttribute('shadow-dom', enabled.toString());
  }

  private calculateNaturalSize() {
    const container = this.getContainer();
    if (!container || !this.isContentLoaded) return;

    const keyboardElement = container.querySelector('virtual-keyboard') as HTMLElement;
    if (!keyboardElement) return;

    try {
      // Get dimensions in natural state
      const rect = keyboardElement.getBoundingClientRect();
      this.naturalWidth = rect.width;
      this.naturalHeight = rect.height;

      if (debug.enabled) {
        console.log('keyboard-size-calculated', {
          naturalWidth: this.naturalWidth,
          naturalHeight: this.naturalHeight
        });
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      if (debug.showConsole) {
        console.error('Failed to calculate keyboard size.', errorObj);
      }
    }
  }

  private setupResizeObserver() {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.applyScaling();
      });
    }
    
    // Disconnect existing observations
    this.resizeObserver.disconnect();
    
    // Determine what to observe based on current units
    if (this.hasContainerRelativeUnits() && this.parentElement) {
      // Observe parent container for relative units like %, em, rem
      this.resizeObserver.observe(this.parentElement);
      console.log('PrefabVirtualKeyboard: Observing parent container for relative units');
    } else if (this.hasViewportUnits() || this.currentUnits.has('px')) {
      // Observe element itself for viewport units and pixels
      this.resizeObserver.observe(this);
      console.log('PrefabVirtualKeyboard: Observing element itself for viewport/absolute units');
    }
    
    // Setup window resize listener for viewport units
    this.setupWindowResizeListener();
  }

  private windowResizeListener?: (() => void) | null;
  private currentUnits: Set<string> = new Set();

  private setupWindowResizeListener() {
    if (this.windowResizeListener) {
      window.removeEventListener('resize', this.windowResizeListener);
      this.windowResizeListener = null;
    }
    
    // Always add window resize listener for automatic scaling
    this.windowResizeListener = () => {
      console.log('PrefabVirtualKeyboard: Window resize detected - recalculating scaling');
      this.applyScaling();
    };
    window.addEventListener('resize', this.windowResizeListener);
    console.log('PrefabVirtualKeyboard: Window resize listener added for automatic scaling');
  }

  private updateResizeObserver() {
    // Update what we're observing based on current units
    this.setupResizeObserver();
  }

  private hasViewportUnits(): boolean {
    const viewportUnits = ['vh', 'vw', 'vmin', 'vmax'];
    return Array.from(this.currentUnits).some(unit => viewportUnits.includes(unit));
  }

  private hasContainerRelativeUnits(): boolean {
    const containerUnits = ['%', 'em', 'rem'];
    return Array.from(this.currentUnits).some(unit => containerUnits.includes(unit));
  }

  private parseCssValue(value: string): number {
    if (!value) return 0;
    
    // Remove spaces and convert to lowercase
    const cleanValue = value.toString().trim().toLowerCase();
    
    // Handle pure numbers (default to pixels)
    if (/^\d+(\.\d+)?$/.test(cleanValue)) {
      this.currentUnits.add('px');
      return parseFloat(cleanValue);
    }
    
    // Handle values with units
    const match = cleanValue.match(/^(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|vmin|vmax|cm|mm|in|pt|pc|ex|ch)$/);
    if (!match) return 0;
    
    const numValue = parseFloat(match[1]);
    const unit = match[2];
    this.currentUnits.add(unit);
    
    switch (unit) {
      case 'px':
        return numValue;
      case 'em':
        return numValue * parseFloat(getComputedStyle(this).fontSize);
      case 'rem':
        return numValue * parseFloat(getComputedStyle(document.documentElement).fontSize);
      case '%':
        const parentRect = this.parentElement?.getBoundingClientRect();
        return numValue * (parentRect ? parentRect.width / 100 : 0);
      case 'vh':
        return numValue * window.innerHeight / 100;
      case 'vw':
        return numValue * window.innerWidth / 100;
      case 'vmin':
        return numValue * Math.min(window.innerWidth, window.innerHeight) / 100;
      case 'vmax':
        return numValue * Math.max(window.innerWidth, window.innerHeight) / 100;
      case 'cm':
        return numValue * 96 / 2.54; // 1cm = 96px/2.54
      case 'mm':
        return numValue * 96 / 25.4; // 1mm = 96px/25.4
      case 'in':
        return numValue * 96; // 1in = 96px
      case 'pt':
        return numValue * 96 / 72; // 1pt = 96px/72
      case 'pc':
        return numValue * 96 / 6; // 1pc = 96px/6
      case 'ex':
        return numValue * parseFloat(getComputedStyle(this).fontSize) * 0.5; // Approximate value
      case 'ch':
        return numValue * parseFloat(getComputedStyle(this).fontSize) * 0.6; // Approximate value
      default:
        return 0;
    }
  }

  private applyScaling() {
    const container = this.getContainer();
    if (!container || !this.isContentLoaded || this.naturalWidth === 0 || this.naturalHeight === 0) return;

    const keyboardElement = container.querySelector('virtual-keyboard') as HTMLElement;
    if (!keyboardElement) return;

    // Clear current units tracking before parsing new values
    this.currentUnits.clear();

    // Get CSS-specified dimensions
    const computedStyle = getComputedStyle(this);
    let targetWidth = this.parseCssValue(computedStyle.width);
    let targetHeight = this.parseCssValue(computedStyle.height);

    // Get attribute-specified dimensions (higher priority than CSS)
    const attrWidth = this.parseCssValue(this.getAttribute('width') || '');
    const attrHeight = this.parseCssValue(this.getAttribute('height') || '');
    
    if (attrWidth > 0) targetWidth = attrWidth;
    if (attrHeight > 0) targetHeight = attrHeight;

    // Auto-detect container constraints if no explicit dimensions are set
    const shouldAutoScale = targetWidth === 0 && targetHeight === 0;
    
    if (shouldAutoScale) {
      // Get available space from parent container or viewport
      const parentWidth = this.parentElement?.getBoundingClientRect().width || window.innerWidth;
      const availableWidth = Math.min(parentWidth, window.innerWidth) - 20; // 20px padding/margin allowance
      const availableHeight = window.innerHeight - 100; // 100px for other UI elements
      
      // Only scale if keyboard natural size exceeds available space
      // Don't scale up when window is larger than natural size
      if (this.naturalWidth > availableWidth) {
        targetWidth = availableWidth;
      }
      
      if (this.naturalHeight > availableHeight) {
        targetHeight = availableHeight;
      }
      
      // If no scaling is needed (window >= natural size), don't set any dimensions
      // This allows the keyboard to maintain its natural size without stretching
      // BUT: Don't clear existing zoom/transform if they were set by mobile scaling
      if (targetWidth === 0 && targetHeight === 0) {
        // ARCHITECTURAL PRINCIPLE: Never modify the internal virtual-keyboard element
        // Only scale the container itself - but preserve mobile scaling
        const currentZoom = this.style.zoom;
        const currentTransform = this.style.transform;
        
        // Only clear if no mobile scaling is active (zoom is not set or is 1)
        if (!currentZoom || currentZoom === '1') {
          this.style.zoom = '';
        }
        if (!currentTransform || currentTransform === 'none') {
          this.style.transform = '';
        }
        return;
      }
    }

    // If no target dimensions are specified or needed, use natural dimensions
    if (targetWidth === 0 && targetHeight === 0) {
      // ARCHITECTURAL PRINCIPLE: Never modify the internal virtual-keyboard element
      // Only scale the container itself
      this.style.transform = '';
      return;
    }

    // Calculate scaling ratios
    let scaleX = 1;
    let scaleY = 1;

    if (targetWidth > 0 && targetHeight > 0) {
      // Both width and height specified - don't preserve aspect ratio
      scaleX = targetWidth / this.naturalWidth;
      scaleY = targetHeight / this.naturalHeight;
    } else if (targetWidth > 0) {
      // Only width specified - preserve aspect ratio
      scaleX = targetWidth / this.naturalWidth;
      scaleY = scaleX;
    } else if (targetHeight > 0) {
      // Only height specified - preserve aspect ratio
      scaleY = targetHeight / this.naturalHeight;
      scaleX = scaleY;
    }

    // ARCHITECTURAL PRINCIPLE: Apply scaling to the prefab container, NOT the internal virtual-keyboard
    // Use transform instead of zoom for better control and to avoid affecting internal elements
    const scaleValue = Math.min(scaleX, scaleY); // Use uniform scale to maintain aspect ratio
    
    // Apply transform to the prefab element itself (agnostic scaling)
    this.style.transform = `scale(${scaleValue})`;
    this.style.transformOrigin = 'top left';
    
    // ARCHITECTURAL PRINCIPLE: Never modify the internal virtual-keyboard element
    // The virtual-keyboard maintains its natural size, only the container scales

    console.log('PrefabVirtualKeyboard: Agnostic scaling applied to container', {
      naturalWidth: this.naturalWidth,
      naturalHeight: this.naturalHeight,
      targetWidth,
      targetHeight,
      scaleX,
      scaleY,
      finalScale: scaleValue,
      aspectRatioPreserved: !(targetWidth > 0 && targetHeight > 0),
      unitsUsed: Array.from(this.currentUnits),
      hasViewportUnits: this.hasViewportUnits(),
      hasContainerRelativeUnits: this.hasContainerRelativeUnits(),
      autoScaled: shouldAutoScale,
      // ARCHITECTURAL PRINCIPLE: Internal virtual-keyboard element remains untouched
      internalKeyboardUnmodified: true
    });
  }
}

// Register custom element
customElements.define('prefab-virtual-keyboard', PrefabVirtualKeyboard);