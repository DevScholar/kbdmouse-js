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

    /**
     * Pause the mouse polyfill. Touch events will no longer be converted to mouse events.
     * Call {@link resume} to re-enable.
     */
    pause() {
        this.userOperation.remove();
    }

    /**
     * Resume the mouse polyfill after it has been paused with {@link pause}.
     */
    resume() {
        this.userOperation.attach();
    }

    /**
     * Permanently destroy this instance and remove all event listeners.
     * The instance cannot be reused after calling this method.
     */
    destroy() {
        this.userOperation.remove();
    }

    /**
     * Detach the polyfill from the element, removing all touch event listeners.
     * Call {@link attach} to reinstall. Semantically equivalent to {@link pause},
     * but expresses intent to fully uninstall the polyfill rather than temporarily suspend it.
     */
    detach() {
        this.userOperation.remove();
    }

    /**
     * Reattach the polyfill to the element after {@link detach}.
     * Semantically equivalent to {@link resume}, but pairs with {@link detach}.
     */
    attach() {
        this.userOperation.attach();
    }
}
