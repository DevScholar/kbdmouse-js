import type { VkKeyboard } from "./vk-keyboard";

export class VkVisual {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    keyDown(code: string) {
        const vkKey = this.vkKeyboard.querySelector(`[data-code="${code}"]`) as HTMLElement;
        vkKey.classList.add('vk-key-down');
        vkKey.setAttribute('aria-pressed', 'true');
    }

    keyUp(code: string) {
        const vkKey = this.vkKeyboard.querySelector(`[data-code="${code}"]`) as HTMLElement;
        vkKey.classList.remove('vk-key-down');
        vkKey.removeAttribute('aria-pressed');
    }

    capitalizeKeyboard(enabled: boolean) {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key') as NodeListOf<HTMLElement>;
        vkKeys.forEach(vkKey => {
            const code = vkKey.dataset.code!;
            if (this.vkKeyboard.jsonLayout.isAlphabetKey(code)) {
                if (enabled) {
                    vkKey.classList.add('vk-caps-lock');
                } else {
                    vkKey.classList.remove('vk-caps-lock');
                }
            }
        });
    }

        shiftKeyboard(enabled: boolean) {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key') as NodeListOf<HTMLElement>;
        vkKeys.forEach(vkKey => {
            const code = vkKey.dataset.code!;
            const isShiftable = this.vkKeyboard.jsonLayout.isShiftableKey(code);
            if (isShiftable) {
                if (enabled) {
                    vkKey.classList.add('vk-shift');
                } else {
                    vkKey.classList.remove('vk-shift');
                }
            }
        });
    }

    numLockKeyboard(activated: boolean) {
        const vkKeys = this.vkKeyboard.querySelectorAll('.vk-key') as NodeListOf<HTMLElement>;
        vkKeys.forEach(vkKey => {
            const code = vkKey.dataset.code!;
            if (code.startsWith('Numpad')) {
                if (activated) {
                    vkKey.classList.add('vk-num-lock');
                } else {
                    vkKey.classList.remove('vk-num-lock');
                }
            }
        });
    }

    toggleKey(code: string, activated: boolean) {
        const vkKey = this.vkKeyboard.querySelector(`[data-code="${code}"]`) as HTMLElement;
        if (activated) {
            vkKey.classList.add('vk-key-down');
        } else {
            vkKey.classList.remove('vk-key-down');
        }
        
        if (code === 'CapsLock') {
            this.capitalizeKeyboard(activated);
        } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
            this.shiftKeyboard(activated);
        } else if (code === 'NumLock') {
            this.numLockKeyboard(activated);
        }
    }


}