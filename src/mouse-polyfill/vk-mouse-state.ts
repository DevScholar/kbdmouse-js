import { VkMouse } from "./vk-mouse";

export class VkMouseState {
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }
    vkMouse: VkMouse;

    // Operation Modes
    mode: "idle" | "touching" | "hover-moving" | "dragging" | "right-click-done" | "long-pressed" = "idle";
    
    // Coordinates
    lastX: number = 0;
    lastY: number = 0;
    startX: number = 0;
    startY: number = 0;

    // Timing
    touchStartTime: number = 0;
    lastClickTime: number = 0; // For double click detection
    
    // Status flags
    isDragging: boolean = false;
    hasMovedSignificantDistance: boolean = false;

    
    /**
     * Checks if distance from start point exceeds threshold
     */
    checkMoved(currentX: number, currentY: number): boolean {
        if (this.hasMovedSignificantDistance) return true;

        const dist = Math.sqrt(
            Math.pow(currentX - this.startX, 2) + 
            Math.pow(currentY - this.startY, 2)
        );
        
        if (dist > this.vkMouse.config.moveThresholdDistance) {
            this.hasMovedSignificantDistance = true;
            return true;
        }
        return false;
    }

    reset() {
        this.mode = "idle";
        this.isDragging = false;
        this.hasMovedSignificantDistance = false;
    }
}