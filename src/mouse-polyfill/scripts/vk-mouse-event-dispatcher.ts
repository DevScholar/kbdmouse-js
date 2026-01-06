import type { VkMouse } from "./vk-mouse";

export class VkMouseEventDispatcher {
    vkMouse: VkMouse;
    
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }

    private createEvent(type: string, x: number, y: number, buttons: number = 0, button: number = 0) {
        return new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            buttons: buttons, // Sum of buttons currently pressed (1=Left, 2=Right)
            button: button    // The button changing state (0=Left, 2=Right)
        });
    }

    dispatchMouseMove(x: number, y: number, isLeftButtonDown: boolean) {
        // buttons: 1 if left is down, 0 otherwise
        const buttons = isLeftButtonDown ? 1 : 0;
        this.vkMouse.element.dispatchEvent(this.createEvent("mousemove", x, y, buttons, 0));
    }

    dispatchMouseDown(x: number, y: number, isRightClick: boolean = false) {
        const button = isRightClick ? 2 : 0;
        const buttons = isRightClick ? 2 : 1;
        this.vkMouse.element.dispatchEvent(this.createEvent("mousedown", x, y, buttons, button));
    }

    dispatchMouseUp(x: number, y: number, isRightClick: boolean = false) {
        const button = isRightClick ? 2 : 0;
        // buttons is 0 because we just released it
        this.vkMouse.element.dispatchEvent(this.createEvent("mouseup", x, y, 0, button));
    }

    dispatchClick(x: number, y: number) {
        this.vkMouse.element.dispatchEvent(this.createEvent("click", x, y, 0, 0));
    }

    dispatchDblClick(x: number, y: number) {
        this.vkMouse.element.dispatchEvent(this.createEvent("dblclick", x, y, 0, 0));
    }

    dispatchContextMenu(x: number, y: number) {
        this.vkMouse.element.dispatchEvent(this.createEvent("contextmenu", x, y, 2, 2));
    }
}