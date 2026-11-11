// vk-auto-resize.ts
import type { VkKeyboard } from "./vk-keyboard";

export class VkAutoResize {
  private vkKeyboard: VkKeyboard;
  private resizeObserver: ResizeObserver | null = null;
  private originalWidth: number = 0;
  private originalHeight: number = 0;
  private domContentLoadedHandler: (() => void) | null = null;

  constructor(vkKeyboard: VkKeyboard) {
    this.vkKeyboard = vkKeyboard;
  }

  private init(): void {
    if (document.readyState === "loading") {
      this.domContentLoadedHandler = () => {
        this.domContentLoadedHandler = null;
        this.setupAutoResize();
      };
      document.addEventListener(
        "DOMContentLoaded",
        this.domContentLoadedHandler,
        { once: true },
      );
    } else {
      this.setupAutoResize();
    }
  }

  private setupAutoResize(): void {
    const keyboardElement = this.vkKeyboard
      .getRoot()
      .querySelector(".vk-keyboard") as HTMLElement;

    if (!keyboardElement) {
      return;
    }

    // The key table is laid out at whatever width the element around it has,
    // so an element narrower than the keys would be measured already
    // squeezed. The natural size is what the scaling is based on, so the
    // constraint comes off for the measurement
    const previousWidth = keyboardElement.style.width;
    keyboardElement.style.width = "max-content";
    this.originalWidth = keyboardElement.offsetWidth;
    this.originalHeight = keyboardElement.offsetHeight;
    keyboardElement.style.width = previousWidth;

    // Set transform origin to top left corner
    keyboardElement.style.transformOrigin = "0 0";

    // Create ResizeObserver to monitor parent element size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this.vkKeyboard) {
          this.handleResize();
        }
      }
    });

    // Start observing the parent element
    this.resizeObserver.observe(this.vkKeyboard);

    // Apply initial scaling
    this.applyScaling();
  }

  private handleResize(): void {
    this.applyScaling();
  }

  private calculateScale(): number {
    const parentWidth = this.vkKeyboard.offsetWidth;
    const parentHeight = this.vkKeyboard.offsetHeight;

    if (parentWidth === 0 || parentHeight === 0) {
      return 1;
    }

    // One factor for both axes keeps the keys in proportion however the
    // element is sized, which is what a normal element does with its
    // content: it reflows or it scrolls, it never stretches it
    return Math.min(
      parentWidth / this.originalWidth,
      parentHeight / this.originalHeight,
    );
  }

  private applyScaling(): void {
    const keyboardElement = this.vkKeyboard
      .getRoot()
      .querySelector(".vk-keyboard") as HTMLElement;

    if (
      !keyboardElement ||
      this.originalWidth === 0 ||
      this.originalHeight === 0
    ) {
      return;
    }

    // zoom rather than transform, because zoom takes part in layout: the key
    // table is laid out at its natural size and then occupies the scaled
    // size, so the element around it gets a height that matches and a page
    // that sets only a width gets a keyboard in proportion. A transform
    // would leave the layout at the natural height and stretch the keys.
    // Every current browser implements zoom, which the standard picked up
    keyboardElement.style.setProperty("zoom", String(this.calculateScale()));
  }

  // Public method: Reinitialize (for dynamic content changes)
  public reinitialize(): void {
    this.dispose();
    this.init();
  }

  // Public method: Clean up resources
  public dispose(): void {
    if (this.domContentLoadedHandler) {
      document.removeEventListener(
        "DOMContentLoaded",
        this.domContentLoadedHandler,
      );
      this.domContentLoadedHandler = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Reset child element transform
    const keyboardElement = this.vkKeyboard
      .getRoot()
      .querySelector(".vk-keyboard") as HTMLElement;
    if (keyboardElement) {
      keyboardElement.style.removeProperty("zoom");
      keyboardElement.style.transform = "";
      keyboardElement.style.transformOrigin = "";
    }

    this.originalWidth = 0;
    this.originalHeight = 0;
  }

  // Public method: Manually trigger scaling (for external control)
  public triggerResize(): void {
    this.applyScaling();
  }

  // Public method: Get current scaling information
  public getScaleInfo(): { scaleX: number; scaleY: number } {
    if (this.originalWidth === 0 || this.originalHeight === 0) {
      return { scaleX: 1, scaleY: 1 };
    }

    const scale = this.calculateScale();

    return { scaleX: scale, scaleY: scale };
  }
}
