// vk-keyboard.ts
import { VkEditing } from './vk-editing';
import { VkEventDispatcher } from './vk-event-dispatcher';
import { VkJsonLayout } from './vk-json-layout';
import { VkLogger } from './vk-logger';
import { VkState } from './vk-state';
import { VkTemplate } from './vk-template';
import { VkUserOperation } from './vk-user-operation';
import { VkVisual } from './vk-visual';
import { VkAutoResize } from './vk-auto-resize';

import keyboardStyles from '../styles/vk-keyboard.css?inline';

export class VkKeyboard extends HTMLElement {
    private _isInitialized = false;
    private _shadowRoot: ShadowRoot | null = null;

    constructor() {
        super();
    }

    private get useShadowDOM(): boolean {
        const shadowAttr = this.getAttribute('shadow');
        return shadowAttr !== 'false';
    }

    async connectedCallback() {
        if (this._isInitialized) return;
        this._isInitialized = true;

        const templateHtml = await this.template.getKeyboardTemplateHtml();

        if (this.useShadowDOM) {
            this._shadowRoot = this.attachShadow({ mode: 'open' });
            const styleElement = document.createElement('style');
            styleElement.textContent = keyboardStyles;
            this._shadowRoot.appendChild(styleElement);
            this._shadowRoot.innerHTML += templateHtml;
        } else {
            this.innerHTML = templateHtml;
        }

        // Initialize auto-resize
        this.autoResize.reinitialize();

        this.userOperation.preventFocusForVkKeyboard();
        this.userOperation.handlePointerOperationsForVkKeyboard();
    }

    public get shadowRootElement(): ShadowRoot | null {
        return this._shadowRoot;
    }

    public get vkKeyboardElement(): HTMLElement | null {
        if (this.useShadowDOM && this._shadowRoot) {
            return this._shadowRoot.querySelector('.vk-keyboard') as HTMLElement;
        }
        return this.querySelector('.vk-keyboard') as HTMLElement;
    }

    public querySelector(selector: string): Element | null {
        if (this.useShadowDOM && this._shadowRoot) {
            return this._shadowRoot.querySelector(selector);
        }
        return super.querySelector(selector);
    }

    public querySelectorAll(selector: string): NodeListOf<Element> {
        if (this.useShadowDOM && this._shadowRoot) {
            return this._shadowRoot.querySelectorAll(selector);
        }
        return super.querySelectorAll(selector);
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
        classThis: this as unknown as VkKeyboard,

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
        },
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
