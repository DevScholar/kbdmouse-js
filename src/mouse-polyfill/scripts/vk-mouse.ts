import { VkMouseEventDispatcher } from './vk-mouse-event-dispatcher';
import { VkMouseUserOperation } from './vk-mouse-user-operation';
import { VkMouseState } from './vk-mouse-state';

export class VkMouse {
    /** @internal */
    element: HTMLElement;
    /** @internal */
    userOperation: VkMouseUserOperation;
    /** @internal */
    eventDispatcher: VkMouseEventDispatcher;
    /** @internal */
    state: VkMouseState;

    constructor(element: HTMLElement) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error('VkMouse requires a valid HTMLElement');
        }
        if (!element.isConnected) {
            throw new Error('VkMouse requires an element that is connected to the DOM');
        }
        this.element = element;
        this.state = new VkMouseState(this);
        this.eventDispatcher = new VkMouseEventDispatcher(this);
        this.userOperation = new VkMouseUserOperation(this);

        this.userOperation.init();
    }

    detach() {
        this.userOperation.remove();
    }

    attach() {
        this.userOperation.attach();
    }
}
