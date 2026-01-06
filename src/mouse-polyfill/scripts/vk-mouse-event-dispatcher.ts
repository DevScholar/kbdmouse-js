import type { VkMouse } from "./vk-mouse";

export class VkMouseEventDispatcher {
    vkMouse: VkMouse;
    
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }

    private getTarget(x: number, y: number): Element {
        // Find the specific DOM element under these coordinates to emulate physical cursor behavior
        let target = document.elementFromPoint(x, y);
        
        // Fallback to the root element if nothing is found (e.g., outside window)
        // or if the found element is not a descendant of our container (optional check, depends on use case)
        if (!target) {
            return this.vkMouse.element;
        }
        return target;
    }

    private createEvent(type: string, x: number, y: number, buttons: number = 0, button: number = 0) {
        return new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: x,
            clientY: y,
            screenX: x, // Simple mapping, strictly ideally should add screen offset
            screenY: y,
            buttons: buttons, 
            button: button,
            fill: null // Legacy fix for some obscure frameworks
        } as MouseEventInit); // Cast needed for custom properties if strict
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
        
        // Dispatch mousedown on the specific element under the finger (e.g., the draggable header)
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