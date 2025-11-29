import type { VkKeyboard } from "./vk-keyboard";

export class VkEditing {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    keyDown(code: string) {
        let text = "";
        let key = "";
        
        // Get the key value from layout data for non-printable keys
        const keyItem = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
        if (keyItem && keyItem.key) {
            key = keyItem.key;
        }
        
        if (this.vkKeyboard.editing.isEditable() && this.vkKeyboard.jsonLayout.isPrintableKey(code)) {
            text = this.getKeyValue(code);
            this.insertText(text);
        } else if (code === "Backspace") {
            this.deleteContentBackward();
        } else if (code === "Delete") {
            this.deleteContentForward();
        } else if (key === "Enter") {
            this.insertLineBreak();
        } else if (key === "ArrowRight") {
            this.moveCursor(1, "right");
        } else if (key === "ArrowLeft") {
            this.moveCursor(1, "left");
        } else if (key === "ArrowUp") {
            this.moveCursor(1, "up");
        } else if (key === "ArrowDown") {
            this.moveCursor(1, "down");
        } else if (key === "Home") {
            this.moveCursorToEdge("lineStart");
        } else if (key === "End") {
            this.moveCursorToEdge("lineEnd");
        }
    }



    isEditable() {
        const activeElement = document.activeElement!;
        const textLikeTypes = ["text", "password", "search", "tel", "url", "email", "number"];
        if (activeElement.tagName === "INPUT" && textLikeTypes.includes((activeElement as HTMLInputElement).type)) {
            return true;
        }
        else if (activeElement.tagName === "TEXTAREA") {
            return true;
        }
        else if (activeElement instanceof HTMLElement) {
            return activeElement.contentEditable === "true";
        } else {
            return false;
        }
    }

    moveCursor(step: number, direction: "left" | "right" | "up" | "down") {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (direction === "left") {
                input.setSelectionRange(selectionStart - step, selectionEnd - step);
            } else if (direction === "right") {
                input.setSelectionRange(selectionStart + step, selectionEnd + step);
            } else if (direction === "up") {
                input.setSelectionRange(selectionStart - step, selectionEnd - step);
            } else if (direction === "down") {
                input.setSelectionRange(selectionStart + step, selectionEnd + step);
            }
        }
    }

    moveCursorToEdge(destination: "textBoxStart" | "textBoxEnd" | "lineStart" | "lineEnd") {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (destination === "textBoxStart") {
                input.setSelectionRange(0, 0);
            } else if (destination === "textBoxEnd") {
                input.setSelectionRange(input.value.length, input.value.length);
            } else if (destination === "lineStart") {
                input.setSelectionRange(selectionStart - (selectionStart - input.value.lastIndexOf("\n", selectionStart - 1)), selectionStart - (selectionStart - input.value.lastIndexOf("\n", selectionStart - 1)));
            } else if (destination === "lineEnd") {
                input.setSelectionRange(selectionEnd - (selectionEnd - input.value.indexOf("\n", selectionEnd)), selectionEnd - (selectionEnd - input.value.indexOf("\n", selectionEnd)));
            }
        }
    }

    insertText(text: string) {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            input.value = input.value.slice(0, selectionStart) + text + input.value.slice(selectionEnd);
            input.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
        }
    }

    insertLineBreak() {
        this.insertText("\n");
    }

    deleteContentBackward() {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (selectionStart !== selectionEnd) {
                input.value = input.value.slice(0, selectionStart - 1) + input.value.slice(selectionEnd);
                input.setSelectionRange(selectionStart - 1, selectionStart - 1);
            } else if (selectionStart > 0) {
                input.value = input.value.slice(0, selectionStart - 1) + input.value.slice(selectionEnd);
                input.setSelectionRange(selectionStart - 1, selectionStart - 1);
            }
        }
    }

    deleteContentForward() {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (selectionStart !== selectionEnd) {
                input.value = input.value.slice(0, selectionStart) + input.value.slice(selectionEnd);
                input.setSelectionRange(selectionStart, selectionStart);
            } else if (selectionEnd < input.value.length) {
                input.value = input.value.slice(0, selectionEnd) + input.value.slice(selectionEnd + 1);
                input.setSelectionRange(selectionEnd, selectionEnd);
            }
        }
    }

    /**
     * Returns the actual character to be input for the given code, based on current modifier states
     * @param code Keyboard key code
     * @returns Text to insert or key value from layout file
     */
    getKeyValue(code: string): string {
        const keyItem = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
        if (!keyItem || !keyItem.key) {
            return "";
        }
        
        // Check modifier states
        const isShift = this.vkKeyboard.state.getModifierState("ShiftLeft") || this.vkKeyboard.state.getModifierState("ShiftRight");
        const isCaps = this.vkKeyboard.state.getModifierState("CapsLock");
        const isNumLock = this.vkKeyboard.state.getModifierState("NumLock");
        const isAlpha = this.vkKeyboard.jsonLayout.isAlphabetKey(code);
        const isNumpad = code.startsWith("Numpad");

        // Handle numpad keys with numlock
        if (isNumpad) {
            if (isNumLock) {
                return keyItem.numLocked?.key || keyItem.key;
            } else {
                // For non-numeric numpad keys when numlock is off, use the standard value
                return keyItem.key;
            }
        }

        // Shift + CapsLock: letters forced lowercase, others use shifted
        if (isShift && isCaps) {
            return isAlpha ? keyItem.key : (keyItem.shifted?.key || keyItem.key);
        }
        // Shift only: use shifted value
        if (isShift) {
            return keyItem.shifted?.key || keyItem.key;
        }
        // CapsLock only: letters uppercase, others unchanged
        if (isCaps) {
            return isAlpha ? keyItem.key.toUpperCase() : keyItem.key;
        }
        // No modifiers: original value
        return keyItem.key;
    }
}
