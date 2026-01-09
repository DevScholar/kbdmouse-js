import type { VkMouse } from "./vk-mouse";

export class VkMouseEventDispatcher {
    vkMouse: VkMouse;
    
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }

    private getTarget(x: number, y: number): Element {
        let target = document.elementFromPoint(x, y);
        if (!target) {
            return this.vkMouse.element;
        }
        return target;
    }

    private createEvent(type: string, x: number, y: number, buttons: number, button: number) {
        return new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            screenX: x, 
            screenY: y,
            buttons: buttons, 
            button: button
        });
    }

    dispatchMouseMove(x: number, y: number, isLeftButtonDown: boolean) {
        const buttons = isLeftButtonDown ? 1 : 0;
        const target = this.getTarget(x, y);
        target.dispatchEvent(this.createEvent("mousemove", x, y, buttons, 0));
    }

    dispatchMouseDown(x: number, y: number, isRightClick: boolean = false) {
        const button = isRightClick ? 2 : 0;
        const buttons = isRightClick ? 2 : 1;
        const target = this.getTarget(x, y);
        target.dispatchEvent(this.createEvent("mousedown", x, y, buttons, button));
    }

    dispatchMouseUp(x: number, y: number, isRightClick: boolean = false) {
        const button = isRightClick ? 2 : 0;
        const target = this.getTarget(x, y);
        target.dispatchEvent(this.createEvent("mouseup", x, y, 0, button));
    }

    dispatchClick(x: number, y: number) {
        const target = this.getTarget(x, y);
        target.dispatchEvent(this.createEvent("click", x, y, 0, 0));
    }

    dispatchDblClick(x: number, y: number) {
        const target = this.getTarget(x, y);
        target.dispatchEvent(this.createEvent("dblclick", x, y, 0, 0));
    }

    dispatchContextMenu(x: number, y: number) {
        const target = this.getTarget(x, y);
        target.dispatchEvent(this.createEvent("contextmenu", x, y, 2, 2));
    }
}