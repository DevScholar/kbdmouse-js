import { VkKeyboard } from "./vk-keyboard";
export class VkEventDispatcher {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    /**
     * Get modifier states for keyboard events
     */
    private getModifierStates() {
        return {
            shiftKey: this.vkKeyboard.state.isKeyDown('ShiftLeft') || this.vkKeyboard.state.isKeyDown('ShiftRight'),
            ctrlKey: this.vkKeyboard.state.isKeyDown('ControlLeft') || this.vkKeyboard.state.isKeyDown('ControlRight'),
            altKey: this.vkKeyboard.state.isKeyDown('AltLeft') || this.vkKeyboard.state.isKeyDown('AltRight'),
            metaKey: this.vkKeyboard.state.isKeyDown('MetaLeft') || this.vkKeyboard.state.isKeyDown('MetaRight'),
            capsLock: this.vkKeyboard.state.isToggleKeyActivated('CapsLock'),
            numLock: this.vkKeyboard.state.isToggleKeyActivated('NumLock')
        };
    }


    keyDown(code: string, repeat: boolean = false) {
        const item = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
        if (!item) return;

        const activeElement = document.activeElement as HTMLElement;
        const effectiveKey = this.vkKeyboard.editing.getKeyValue(code);
        const modifierStates = this.getModifierStates();

        // Create and dispatch keyboard events
        const keyDownEvent = new KeyboardEvent('keydown', {
            key: effectiveKey,
            code: item.code,
            keyCode: item.keyCode,
            which: item.keyCode,
            location: item.location,
            bubbles: true,
            cancelable: true,
            view: window,
            repeat: repeat,
            ...modifierStates
        });
        
        // Add a custom property to identify virtual keyboard events
        (keyDownEvent as any).isVirtualKeyboardEvent = true;
        
        activeElement.dispatchEvent(keyDownEvent);
    }

    keyPress(code: string) {
        const item = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
        if (!item) return;

        const activeElement = document.activeElement as HTMLElement;
        const effectiveKey = this.vkKeyboard.editing.getKeyValue(code);
        const modifierStates = this.getModifierStates();
        
        // For keypress event, use ASCII character code instead of physical key code
        const keyAsciiCode = effectiveKey.charCodeAt(0);

        // Create and dispatch keyboard events
        const keyPressEvent = new KeyboardEvent('keypress', {
            key: effectiveKey,
            code: item.code,
            keyCode: keyAsciiCode,
            which: keyAsciiCode,
            location: item.location,
            bubbles: true,
            cancelable: true,
            view: window,
            ...modifierStates
        });
        
        // Add a custom property to identify virtual keyboard events
        (keyPressEvent as any).isVirtualKeyboardEvent = true;
        
        activeElement.dispatchEvent(keyPressEvent);
    }

    keyUp(code: string) {
        const item = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
        if (!item) return;

        const activeElement = document.activeElement as HTMLElement;
        const effectiveKey = this.vkKeyboard.editing.getKeyValue(code);
        const modifierStates = this.getModifierStates();

        // Create and dispatch keyboard events
        const keyUpEvent = new KeyboardEvent('keyup', {
            key: effectiveKey,
            code: item.code,
            keyCode: item.keyCode,
            which: item.keyCode,
            location: item.location,
            bubbles: true,
            cancelable: true,
            view: window,
            ...modifierStates
        });
        
        // Add a custom property to identify virtual keyboard events
        (keyUpEvent as any).isVirtualKeyboardEvent = true;
        
        activeElement.dispatchEvent(keyUpEvent);
    }


}