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
        const modifierStates = this.getModifierStates();

        // Create and dispatch keyboard events
        const keyDownEvent = new KeyboardEvent('keydown', {
            key: item.key,
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
        const modifierStates = this.getModifierStates();

        // For keypress event, use ASCII character code instead of physical key code
        const keyAsciiCode = item.key.charCodeAt(0);

        // Create and dispatch keyboard events
        const keyPressEvent = new KeyboardEvent('keypress', {
            key: item.key,
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
        const modifierStates = this.getModifierStates();

        // Create and dispatch keyboard events
        const keyUpEvent = new KeyboardEvent('keyup', {
            key: item.key,
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

    input(code: string) {
        if (this.vkKeyboard.editing.isEditable()) {
            let keyItem = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
            let inputType: string;
            let data: string | null = null;
            
            if (code === "Backspace") {
                inputType = "deleteContentBackward";
            } else if (code === "Delete") {
                inputType = "deleteContentForward";
            } else if (code === "Enter" || code === "NumpadEnter") {
                inputType = "insertLineBreak";
                data = "\n";
            } else if (code === "Tab") {
                inputType = "insertText";
                data = "\t";
            } else if (this.isPrintableCharacter(keyItem.key)) {
                inputType = "insertText";
                data = keyItem.key;
            } else {
                // For non-printable characters, don't dispatch input event
                return;
            }
            
            const inputEvent = new InputEvent("input", {
                inputType: inputType,
                data: data,
                bubbles: true,
                cancelable: true,
                view: window,
            });

            const activeElement = document.activeElement as HTMLElement;
            activeElement.dispatchEvent(inputEvent);
        }
    }
    
    private isPrintableCharacter(key: string): boolean {
        // Check if the character is printable (has visible representation)
        return key.length === 1 && key.match(/[\x20-\x7E\xA0-\xFF]/) !== null;
    }
}