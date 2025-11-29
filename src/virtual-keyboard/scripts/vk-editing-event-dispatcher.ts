import type { VkKeyboard } from "./vk-keyboard";

export class VkEditingEventDispatcher {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    keyDown(code: string) {
        if (this.vkKeyboard.editing.isEditable() && this.vkKeyboard.jsonLayout.isPrintableKey(code)) {
            const activeElement = document.activeElement!;
            let inputEvent = new InputEvent("input", {
                inputType: "insertText",
                data: this.vkKeyboard.editing.getKeyValue(code),
                bubbles: true,
                cancelable: true
            });
            activeElement.dispatchEvent(inputEvent);
        } else if (code === "Backspace") {
            const activeElement = document.activeElement!;
            let inputEvent = new InputEvent("input", {
                inputType: "deleteContentBackward",
                bubbles: true,
                cancelable: true
            });
            activeElement.dispatchEvent(inputEvent);
        } else if (code === "Delete") {
            const activeElement = document.activeElement!;
            let inputEvent = new InputEvent("input", {
                inputType: "deleteContentForward",
                bubbles: true,
                cancelable: true
            });
            activeElement.dispatchEvent(inputEvent);
        } else if (code === "Enter") {
            const activeElement = document.activeElement!;
            let inputEvent = new InputEvent("input", {
                inputType: "insertLineBreak",
                bubbles: true,
                cancelable: true
            });
            activeElement.dispatchEvent(inputEvent);
        }
    }
}
