import type { VkKeyboard } from "./vk-keyboard";
import layoutTemplate from "../../virtual-keyboard/layouts/layout-template.json";

export class VkJsonLayout {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    async loadLayoutJson(): Promise<void> {
        this.layoutData = layoutTemplate;
    }
    layoutData = {} as any;

    isAlphabetKey(code: string) {
        const alphabets = this.layoutData?.alphabets || [];
        return alphabets.includes(code);
    }

    isPrintableKey(code: string) {
        // Check if num lock is on
        const numLockOn = this.vkKeyboard.state.getModifierState("NumLock");
        const isNumpadKey = code.startsWith('Numpad');

        // Handle numpad keys specially
        if (isNumpadKey) {
            // If num lock is on, numpad number keys are printable
            if (numLockOn && code.match(/^Numpad[0-9]$/)) {
                return true;
            }
            // The four basic operators are always printable
            const numpadOperators = ['NumpadAdd', 'NumpadSubtract', 'NumpadMultiply', 'NumpadDivide'];
            if (numpadOperators.includes(code)) {
                return true;
            }
            // NumpadDecimal is printable (decimal point)
            if (code === 'NumpadDecimal') {
                return true;
            }
            // Other numpad keys (navigation keys when numlock is off) are not printable
            return false;
        }

        // Check if it's an alphabet or number key or a single character key
        const alphabets = this.layoutData?.alphabets || [];
        const numberKeys = this.layoutData?.numberKeys || [];

        // Get the actual key value considering modifier states (like numlock)
        const keyItem = this.getKeyItemByCode(code);
        const keyValue = keyItem?.key || '';

        return alphabets.includes(code) ||
            numberKeys.includes(code) ||
            (keyValue && keyValue.length === 1 && !this.isModifierKey(code) && !this.isToggleKey(code));
    }

    isModifierKey(code: string) {
        const modifierKeys = this.layoutData?.modifierKeys || [];
        return modifierKeys.includes(code);
    }

    isToggleKey(code: string) {
        const toggleKeys = this.layoutData?.toggleKeys || [];
        return toggleKeys.includes(code);
    }

    isNumpadKey(code: string) {
        return code.startsWith("Numpad");
    }
    
    isShiftableKey(code: string) {
        return this.layoutData?.shifted?.keys?.[code] !== undefined;
    }
    getKeyItemByCode(code: string) {
        const key = this.layoutData?.keys?.[code];
        const keyCode = this.layoutData?.keyCodes?.[code];
        const location = this.layoutData?.locations?.[code];
        const label = this.layoutData?.labels?.[code];

        const keyValue = key || label || code;

        let actualKeyValue = keyValue;
        const isNumpad = code.startsWith("Numpad");
        const isNumLock = this.vkKeyboard.state.getModifierState("NumLock");
        const isShift = this.vkKeyboard.state.getModifierState("ShiftLeft") || this.vkKeyboard.state.getModifierState("ShiftRight");
        const isCapsLock = this.vkKeyboard.state.getModifierState("CapsLock");
        
        if (isNumpad && isNumLock && this.layoutData?.numLocked?.keys?.[code]) {
            actualKeyValue = this.layoutData.numLocked.keys[code];
        }
        
        // Handle CapsLock for alphabet keys first
        if (isCapsLock && this.isAlphabetKey(code)) {
            // If CapsLock is active and it's an alphabet key, convert to uppercase
            // But if Shift is also pressed, it should be lowercase (reverse the capslock effect)
            if (isShift) {
                actualKeyValue = keyValue.toLowerCase();
            } else {
                actualKeyValue = this.layoutData.shifted.keys[code] || keyValue.toUpperCase();
            }
        }
        // Handle shifted keys (for symbols like !@#$% etc.) and non-alphabet keys with shift
        else if (isShift && this.layoutData?.shifted?.keys?.[code]) {
            actualKeyValue = this.layoutData.shifted.keys[code];
        }

        return {
            key: actualKeyValue,
            code: code,
            keyCode: keyCode || 0,
            location: location || 0
        };
    }
    getModifierState(code: string) {
        const modifierKeys = this.layoutData?.modifierKeys || [];
        return modifierKeys.includes(code);
    }
}