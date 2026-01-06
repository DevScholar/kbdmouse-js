import type { VkKeyboard } from "./vk-keyboard";
export class VkLogger {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;
    private keyDownListener?: (e: KeyboardEvent) => void;
    private keyUpListener?: (e: KeyboardEvent) => void;
    private keyPressListener?: (e: KeyboardEvent) => void;
    private inputListener?: (e: InputEvent) => void;

    removeEventListeners() {
        if (this.keyDownListener) {
            window.removeEventListener("keydown", this.keyDownListener);
        }
        if (this.keyUpListener) {
            window.removeEventListener("keyup", this.keyUpListener);
        }
        if (this.keyPressListener) {
            window.removeEventListener("keypress", this.keyPressListener);
        }
        if (this.inputListener) {
            window.removeEventListener("input", this.inputListener as EventListener);
        }
    }

    writeLog(msg: string) {
        console.log(msg);
    }

    generateLog() {
        // format: type=keyDown,code=code,key=A,keyCode=65,isTrusted=true
        this.keyDownListener = (e: KeyboardEvent) => {
            this.writeLog("type:" + e.type + ",code:" + e.code + ",key:" + e.key + ",keyCode:" + e.keyCode + ",ctrlKey:" + e.ctrlKey + ",shiftKey:" + e.shiftKey + ",altKey:" + e.altKey + ",isTrusted:" + e.isTrusted);
        };

        this.keyUpListener = (e: KeyboardEvent) => {
            this.writeLog("type:" + e.type + ",code:" + e.code + ",key:" + e.key + ",keyCode:" + e.keyCode + ",ctrlKey:" + e.ctrlKey + ",shiftKey:" + e.shiftKey + ",altKey:" + e.altKey + ",isTrusted:" + e.isTrusted);
        };

        this.keyPressListener = (e: KeyboardEvent) => {
            this.writeLog("type:" + e.type + ",code:" + e.code + ",key:" + e.key + ",keyCode:" + e.keyCode + ",ctrlKey:" + e.ctrlKey + ",shiftKey:" + e.shiftKey + ",altKey:" + e.altKey + ",isTrusted:" + e.isTrusted);
        };

        this.inputListener = (e: InputEvent) => {
            console.log(e.target);
            this.writeLog("type:" + e.type + ",inputType:" + e.inputType + ",data:" + e.data + ",isTrusted:" + e.isTrusted);
        };
        window.addEventListener('keydown', this.keyDownListener);
        window.addEventListener('keyup', this.keyUpListener);
        window.addEventListener('keypress', this.keyPressListener);
        window.addEventListener('input', this.inputListener as EventListener);
    }
}