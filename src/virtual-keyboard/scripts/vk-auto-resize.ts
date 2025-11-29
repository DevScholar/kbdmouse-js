// vk-auto-resize.ts
import type { VkKeyboard } from "./vk-keyboard";

export class VkAutoResize {
    private vkKeyboard: VkKeyboard;
    private resizeObserver: ResizeObserver | null = null;
    private originalWidth: number = 0;
    private originalHeight: number = 0;

    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
        this.init();
    }

    private init(): void {
        // Wait for DOM to load before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupAutoResize();
            });
        } else {
            this.setupAutoResize();
        }
    }

    private setupAutoResize(): void {
        const keyboardElement = this.vkKeyboard.querySelector('.vk-keyboard') as HTMLElement;
        
        if (!keyboardElement) {
            
            return;
        }

        // Get original size of the child element
        const rect = keyboardElement.getBoundingClientRect();
        this.originalWidth = rect.width;
        this.originalHeight = rect.height;

        // Set transform origin to top left corner
        keyboardElement.style.transformOrigin = '0 0';

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

    private applyScaling(): void {
        const keyboardElement = this.vkKeyboard.querySelector('.vk-keyboard') as HTMLElement;
        
        if (!keyboardElement || this.originalWidth === 0 || this.originalHeight === 0) {
            return;
        }

        const parentWidth = this.vkKeyboard.offsetWidth;
        const parentHeight = this.vkKeyboard.offsetHeight;

        // Calculate scaling ratio (without maintaining aspect ratio)
        const scaleX = parentWidth / this.originalWidth;
        const scaleY = parentHeight / this.originalHeight;

        // Apply transform scaling
        keyboardElement.style.transform = `scale(${scaleX}, ${scaleY})`;
    }

    // Public method: Reinitialize (for dynamic content changes)
    public reinitialize(): void {
        this.dispose();
        this.setupAutoResize();
    }

    // Public method: Clean up resources
    public dispose(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // Reset child element transform
        const keyboardElement = this.vkKeyboard.querySelector('.vk-keyboard') as HTMLElement;
        if (keyboardElement) {
            keyboardElement.style.transform = '';
            keyboardElement.style.transformOrigin = '';
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
        const keyboardElement = this.vkKeyboard.querySelector('.vk-keyboard') as HTMLElement;
        
        if (!keyboardElement || this.originalWidth === 0 || this.originalHeight === 0) {
            return { scaleX: 1, scaleY: 1 };
        }

        const parentWidth = this.vkKeyboard.offsetWidth;
        const parentHeight = this.vkKeyboard.offsetHeight;

        return {
            scaleX: parentWidth / this.originalWidth,
            scaleY: parentHeight / this.originalHeight
        };
    }
}