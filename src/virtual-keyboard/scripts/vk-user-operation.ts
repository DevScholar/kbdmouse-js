import type { VkKeyboard } from "./vk-keyboard";

export class VkUserOperation {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }

    vkKeyboard!: VkKeyboard;

    // Key type constants
    private readonly KEY_TYPES = {
        MODIFIER: 'modifier',
        TOGGLE: 'toggle',
        REGULAR: 'regular'
    } as const;

    // Repeat-related properties
    private repeatInterval: number = 50; // Repeat interval (milliseconds)
    private repeatDelay: number = 500; // Repeat start delay (milliseconds)
    private repeatTimers: Map<string, { delayTimer?: number; intervalTimer?: number }> = new Map();

    preventFocusForVkKeyboard() {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key');
        
        vkKeys.forEach((vkKey) => {
            this.preventElementFocus(vkKey);
        });
    }

    private preventElementFocus(element: Element) {
        const preventDefaultEvents = ['mousedown', 'touchstart', 'focus'];
        
        preventDefaultEvents.forEach(eventType => {
            element.addEventListener(eventType, (event: Event) => {
                event.preventDefault();
            });
        });
    }

    handlePointerOperationsForVkKeyboard() {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key');
        
        vkKeys.forEach((vkKey) => {
            this.setupKeyEventListeners(vkKey);
        });
    }

    private setupKeyEventListeners(vkKey: Element) {
        const code = vkKey.getAttribute('data-code') || '';
        const keyType = this.determineKeyType(code);
        
        const pointerDownHandler = this.createPointerDownHandler(code, keyType);
        const pointerReleaseHandler = this.createPointerReleaseHandler(code, keyType);
        
        vkKey.addEventListener('pointerdown', pointerDownHandler);
        vkKey.addEventListener('pointerup', pointerReleaseHandler);
        vkKey.addEventListener('pointerleave', pointerReleaseHandler);
    }

    private determineKeyType(code: string): string {
        if (this.vkKeyboard.jsonLayout.isModifierKey(code)) {
            return this.KEY_TYPES.MODIFIER;
        } else if (this.vkKeyboard.jsonLayout.isToggleKey(code)) {
            return this.KEY_TYPES.TOGGLE;
        } else {
            return this.KEY_TYPES.REGULAR;
        }
    }

    private createPointerDownHandler(code: string, keyType: string) {
        return (_event: Event) => {
            switch (keyType) {
                case this.KEY_TYPES.MODIFIER:
                    this.handleModifierKeyDown(code);
                    break;
                case this.KEY_TYPES.TOGGLE:
                    this.handleToggleKeyDown(code);
                    break;
                case this.KEY_TYPES.REGULAR:
                    this.handleRegularKeyDown(code);
                    break;
            }
        };
    }

    private createPointerReleaseHandler(code: string, keyType: string) {
        return (_event: Event) => {
            switch (keyType) {
                case this.KEY_TYPES.MODIFIER:
                case this.KEY_TYPES.TOGGLE:
                    // Modifier and toggle keys: no action on pointerup/pointerleave
                    break;
                case this.KEY_TYPES.REGULAR:
                    this.handleRegularKeyRelease(code);
                    break;
            }
        };
    }

    private handleModifierKeyDown(code: string) {
        // Modifier keys: toggle state on pointerdown (press if released, release if pressed)
        if (!this.vkKeyboard.state.isKeyDown(code)) {
            this.keyDown(code);
            // Add visual state update, especially for Shift key
            this.updateModifierKeyVisualState(code, true);
        } else {
            this.keyUp(code);
            // Add visual state update, especially for Shift key
            this.updateModifierKeyVisualState(code, false);
        }
    }

    private handleToggleKeyDown(code: string) {
        // Toggle keys: toggle state on pointerdown and generate keydown and keyup events
        if (!this.vkKeyboard.state.isToggleKeyActivated(code)) {
            this.activateToggleKey(code);
        } else {
            this.deactivateToggleKey(code);
        }
    }

    private activateToggleKey(code: string) {
        // If inactive, activate: generate keydown and keyup events, keep visual pressed state
        this.keyDown(code);
        this.vkKeyboard.eventDispatcher.keyUp(code);
        this.vkKeyboard.state.activateToggleKey(code);
        this.vkKeyboard.visual.toggleKey(code, true);
        
        // Update special toggle key visual states
        this.updateToggleKeyVisualState(code, true);
    }

    private deactivateToggleKey(code: string) {
        // If active, deactivate: generate keydown and keyup events, keep visual released state
        this.keyDown(code);
        this.vkKeyboard.eventDispatcher.keyUp(code);
        this.vkKeyboard.state.deactivateToggleKey(code);
        this.vkKeyboard.visual.toggleKey(code, false);
        
        // Update special toggle key visual states
        this.updateToggleKeyVisualState(code, false);
    }

    private updateToggleKeyVisualState(code: string, activated: boolean) {
        if (code === 'NumLock') {
            this.vkKeyboard.visual.numLockKeyboard(activated);
        } else if (code === "ShiftLeft" || code === "ShiftRight") {
            this.vkKeyboard.visual.shiftKeyboard(activated);
        }
    }

    private updateModifierKeyVisualState(code: string, activated: boolean) {
        if (code === "ShiftLeft" || code === "ShiftRight") {
            this.vkKeyboard.visual.shiftKeyboard(activated);
        }
    }

    private handleRegularKeyDown(code: string) {
        // Regular keys: press on pointerdown, support repeat
        if (!this.vkKeyboard.state.isKeyDown(code)) {
            this.executeRegularKeyDown(code);
            this.startRepeat(code);
        }
    }

    private executeRegularKeyDown(code: string) {
        // Execute keydown event
        this.keyDown(code);
        // If printable character, execute keypress event
        if (this.vkKeyboard.jsonLayout.isPrintableKey(code)) {
            this.keyPress(code);
        }
    }

    private handleRegularKeyRelease(code: string) {
        // Regular keys: release on pointerup/pointerleave (only if currently pressed)
        if (this.vkKeyboard.state.isKeyDown(code)) {
            this.stopRepeat(code);
            this.keyUp(code);
            this.keyUpAllModifierKeys();
        }
    }

    keyDown(code: string) {
        const isRepeating = this.vkKeyboard.state.isKeyRepeating(code);
        this.vkKeyboard.eventDispatcher.keyDown(code, isRepeating);
        this.vkKeyboard.visual.keyDown(code);
        this.vkKeyboard.state.keyDown(code);
        this.vkKeyboard.editing.keyDown(code);
        this.vkKeyboard.editingEventDispatcher.keyDown(code);
    }

    keyPress(code: string) {
        if (this.vkKeyboard.jsonLayout.isPrintableKey(code)) {
            this.vkKeyboard.eventDispatcher.keyPress(code);
        }
    }

    keyUp(code: string) {
        this.vkKeyboard.eventDispatcher.keyUp(code);
        this.vkKeyboard.visual.keyUp(code);
        this.vkKeyboard.state.keyUp(code);
    }

    keyUpAllKeys() {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key');
        vkKeys.forEach((vkKey: Element) => {
            const code = vkKey.getAttribute('data-code') || '';
            if (this.vkKeyboard.state.isKeyDown(code)) {
                this.vkKeyboard.eventDispatcher.keyUp(code);
                this.vkKeyboard.visual.keyUp(code);
                this.vkKeyboard.state.keyUp(code);
            }
        });
    }

    keyUpAllModifierKeys() {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key');
        vkKeys.forEach((vkKey: Element) => {
            const code = vkKey.getAttribute('data-code') || '';

            if (this.vkKeyboard.jsonLayout.isModifierKey(code) && this.vkKeyboard.state.isKeyDown(code)) {
                this.vkKeyboard.eventDispatcher.keyUp(code);
                this.vkKeyboard.visual.keyUp(code);
                this.vkKeyboard.state.keyUp(code);
                if (code === 'ShiftLeft' || code === 'ShiftRight') {
                    this.vkKeyboard.visual.shiftKeyboard(false);
                }
            }
        });
    }

    pressKeyButDispatchKeyDownAndKeyUpEvent(code: string) {
        this.keyDown(code);
        this.vkKeyboard.eventDispatcher.keyUp(code);
    }

    keyUpKeyWithoutDispatchKeyUpEvent(code: string) {
        this.vkKeyboard.visual.keyUp(code);
        this.vkKeyboard.state.keyUp(code);
    }

    // Start repeat
    private startRepeat(code: string) {
        // Clear previous timers
        this.stopRepeat(code);

        const timers = { delayTimer: 0, intervalTimer: 0 };
        this.repeatTimers.set(code, timers);

        // Start repeat after delay
        timers.delayTimer = window.setTimeout(() => {
            // Mark as repeating
            this.vkKeyboard.state.setKeyRepeating(code, true);

            // Execute once immediately
            this.executeRepeatAction(code);

            // Then start interval repeat
            timers.intervalTimer = window.setInterval(() => {
                this.executeRepeatAction(code);
            }, this.repeatInterval);
        }, this.repeatDelay);
    }

    // Stop repeat
    private stopRepeat(code: string) {
        const timers = this.repeatTimers.get(code);
        if (timers) {
            if (timers.delayTimer) {
                clearTimeout(timers.delayTimer);
            }
            if (timers.intervalTimer) {
                clearInterval(timers.intervalTimer);
            }
            this.repeatTimers.delete(code);
        }
        // Clear repeating state
        this.vkKeyboard.state.setKeyRepeating(code, false);
    }

    // Execute repeat action
    private executeRepeatAction(code: string) {
        // During repeat: only execute keydown and keypress (no keyup)
        this.keyDown(code);
        if (this.vkKeyboard.jsonLayout.isPrintableKey(code)) {
            this.keyPress(code);
        }
        // Note: No keyup event during repeat - only at the end when user releases the key
    }

}