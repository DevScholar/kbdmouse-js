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
    private _useShadowDOM: boolean | null = null;

    constructor() {
        super();
    }

    private get useShadowDOM(): boolean {
        if (this._useShadowDOM === null) {
            this._useShadowDOM = this.getAttribute('shadow') !== 'false';
        }
        return this._useShadowDOM;
    }

    async connectedCallback() {
        if (this._isInitialized) return;
        this._isInitialized = true;

        const templateHtml = await this.template.getKeyboardTemplateHtml();

        // Guard: element may have been disconnected during the async gap above
        if (!this.isConnected) {
            this._isInitialized = false;
            return;
        }

        if (this.useShadowDOM) {
            if (!this._shadowRoot) {
                this._shadowRoot = this.attachShadow({ mode: 'open' });
            }
            this._shadowRoot.innerHTML = `<style>${keyboardStyles}</style>${templateHtml}`;
        } else {
            this.innerHTML = templateHtml;
        }

        this.autoResize.reinitialize();
        this.userOperation.preventFocusForVkKeyboard();
        this.userOperation.handlePointerOperationsForVkKeyboard();
    }

    disconnectedCallback() {
        this._isInitialized = false;
        this.autoResize.dispose();
        this.userOperation.stopAllRepeat();
        this.userOperation.removeAllKeyListeners();
        this.logger.removeEventListeners();
    }

    /** @internal Returns the shadow root (shadow mode) or the element itself (no-shadow mode) for internal DOM queries. */
    getRoot(): ParentNode {
        return this._shadowRoot ?? this;
    }

    /** @internal */
    get shadowRootElement(): ShadowRoot | null {
        return this._shadowRoot;
    }

    /** @internal */
    get vkKeyboardElement(): HTMLElement | null {
        return (this.getRoot() as ParentNode & { querySelector: ParentNode['querySelector'] })
            .querySelector('.vk-keyboard') as HTMLElement | null;
    }

    /** @internal */
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

    /** @internal */
    editing = new VkEditing(this);
    /** @internal */
    eventDispatcher = new VkEventDispatcher(this);
    /** @internal */
    logger = new VkLogger(this);
    /** @internal */
    state = new VkState(this);
    /** @internal */
    template = new VkTemplate(this);
    /** @internal */
    visual = new VkVisual(this);
    /** @internal */
    jsonLayout = new VkJsonLayout(this);
    /** @internal */
    userOperation = new VkUserOperation(this);
    /** @internal */
    autoResize = new VkAutoResize(this);
}

customElements.define('virtual-keyboard', VkKeyboard);
