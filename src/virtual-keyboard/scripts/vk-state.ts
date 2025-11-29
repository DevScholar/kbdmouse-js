import type { VkKeyboard } from "./vk-keyboard";

export class VkState {
    debug: {
        enabled: boolean;
    } = { enabled: false };

    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    keys = {
        keyDownKeys: new Set<string>(),
        activatedToggleKeys: new Set<string>(),
        repeatingKeys: new Set<string>(),
    }

    isKeyDown = (code: string) => {
        return this.keys.keyDownKeys.has(code);
    }

    isToggleKeyActivated = (code: string) => {
        return this.keys.activatedToggleKeys.has(code);
    }
    

    activateToggleKey = (code: string) => {
        this.keys.activatedToggleKeys.add(code);
    }

    deactivateToggleKey = (code: string) => {
        this.keys.activatedToggleKeys.delete(code);
    }

    getModifierState = (code: string) => {
        // For toggle keys like CapsLock, check activatedToggleKeys
        if (this.vkKeyboard.jsonLayout.isToggleKey(code)) {
            return this.keys.activatedToggleKeys.has(code);
        }
        // For modifier keys like Shift, check keyDownKeys
        else if (this.vkKeyboard.jsonLayout.isModifierKey(code)) {
            return this.keys.keyDownKeys.has(code);
        }
        return false;
    }

    keyDown = (code: string) => {
        this.keys.keyDownKeys.add(code);
    };

    keyUp = (code: string) => {
        this.keys.keyDownKeys.delete(code);
    };

    repeating: boolean = false;

    isKeyRepeating = (code: string) => {
        return this.keys.repeatingKeys.has(code);
    }

    setKeyRepeating = (code: string, repeating: boolean) => {
        if (repeating) {
            this.keys.repeatingKeys.add(code);
        } else {
            this.keys.repeatingKeys.delete(code);
        }
    }
}
