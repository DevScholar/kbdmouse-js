import type { VkMouse } from "./vk-mouse";

export class VkMouseState {
    vkMouse: VkMouse;

    readonly DOUBLE_TAP_DELAY = 500; 
    readonly MOVE_THRESHOLD = 10; 
    readonly SCROLL_MULTIPLIER = 1.5;

    lastTapEndTime: number = 0;
    
    twoFingerStartX: number = 0;
    twoFingerStartY: number = 0;
    lastTwoFingerX: number = 0;
    lastTwoFingerY: number = 0;
    
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }
}