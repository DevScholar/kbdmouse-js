import { VkMouseEventDispatcher } from "./vk-mouse-event-dispatcher";
import { VkMouseUserOperation } from "./vk-mouse-user-operation";
import { VkMouseState } from "./vk-mouse-state";

export class VkMouse {
    element: HTMLElement;
    userOperation: VkMouseUserOperation;
    eventDispatcher: VkMouseEventDispatcher;
    state: VkMouseState;

    constructor(element: HTMLElement) {
        this.element = element;
        this.state = new VkMouseState(this);
        this.eventDispatcher = new VkMouseEventDispatcher(this);
        this.userOperation = new VkMouseUserOperation(this);
        
        this.userOperation.init();
    }
}