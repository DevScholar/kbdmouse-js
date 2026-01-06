// vk-keyboard.ts
import { VkEditing } from "./vk-editing";
import { VkEventDispatcher } from "./vk-event-dispatcher";
import { VkJsonLayout } from "./vk-json-layout";
import { VkLogger } from "./vk-logger";
import { VkState } from "./vk-state";
import { VkTemplate } from "./vk-template";
import { VkUserOperation } from "./vk-user-operation";
import { VkVisual } from "./vk-visual"; 
import { VkAutoResize } from "./vk-auto-resize";

export class VkKeyboard extends HTMLElement {
    private _isInitialized = false;

    constructor() {
        super();
    }

    async connectedCallback() {
        if (this._isInitialized) return;
        this._isInitialized = true;

        this.innerHTML = await this.template.getKeyboardTemplateHtml();
        
        // Initialize auto-resize
        this.autoResize.reinitialize();
        
        this.userOperation.preventFocusForVkKeyboard();
        this.userOperation.handlePointerOperationsForVkKeyboard();
    }

    disconnectedCallback() {
        this._isInitialized = false;
        // Clean up resources
        this.autoResize.dispose();
    }

    // Public method: Manually trigger resize
    public triggerResize(): void {
        this.autoResize.triggerResize();
    }

    // Public method: Get scaling information
    public getScaleInfo(): { scaleX: number; scaleY: number } {
        return this.autoResize.getScaleInfo();
    }

    debug = {
        classThis: this,

        set enabled(value: boolean) {
            if (value) {
                this.classThis.logger.generateLog();
                this.classThis.state.debug.enabled = true;
            } else {
                this.classThis.logger.removeEventListeners();
                this.classThis.state.debug.enabled = false;
            }
        },

        get enabled() {
            return this.classThis.state.debug.enabled;
        }
    };
    editing = new VkEditing(this);
    eventDispatcher = new VkEventDispatcher(this);
    logger = new VkLogger(this);
    state = new VkState(this);
    template = new VkTemplate(this);
    visual = new VkVisual(this);
    jsonLayout = new VkJsonLayout(this);
    userOperation = new VkUserOperation(this);
    autoResize = new VkAutoResize(this);
}

customElements.define('virtual-keyboard', VkKeyboard);