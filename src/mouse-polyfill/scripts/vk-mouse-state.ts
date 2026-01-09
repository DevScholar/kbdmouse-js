import type { VkMouse } from "./vk-mouse";

export class VkMouseState {
    vkMouse: VkMouse;

    readonly DOUBLE_TAP_DELAY = 500; 
    readonly MOVE_THRESHOLD = 10; 

    lastTapEndTime: number = 0;
    
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }
}