import type { VkMouse } from "./vk-mouse";

export class VkMouseState {
    vkMouse: VkMouse;

    // Configuration
    readonly LONG_PRESS_DELAY = 600; // ms
    readonly DBL_CLICK_DELAY = 300; // ms
    readonly MOVE_THRESHOLD = 5; // px (jitter tolerance)

    // Runtime State
    lastClickTime: number = 0;
    
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }
}