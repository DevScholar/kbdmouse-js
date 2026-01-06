import { VkMouse } from "./vk-mouse";

export class VkMouseEventDispatcher {
    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }
    vkMouse: VkMouse;

    private getModifierState(event: TouchEvent | MouseEvent, modifierKey: string): boolean {
        // Simplified for brevity, logic remains similar
        switch (modifierKey) {
            case "Control": return 'ctrlKey' in event ? event.ctrlKey : false;
            case "Shift": return 'shiftKey' in event ? event.shiftKey : false;
            case "Alt": return 'altKey' in event ? event.altKey : false;
            case "Meta": return 'metaKey' in event ? event.metaKey : false;
            default: return false;
        }
    }

    private createMouseEvent(type: string, event: TouchEvent | MouseEvent, button: number, buttons: number) {
        let clientX = 0, clientY = 0, screenX = 0, screenY = 0;
        
        // Extract coordinates
        if ('changedTouches' in event && event.changedTouches.length > 0) {
            const t = event.changedTouches[0];
            clientX = t.clientX; clientY = t.clientY; screenX = t.screenX; screenY = t.screenY;
        } else if ('touches' in event && event.touches.length > 0) {
            const t = event.touches[0];
            clientX = t.clientX; clientY = t.clientY; screenX = t.screenX; screenY = t.screenY;
        } else if ('clientX' in event) {
            const e = event as MouseEvent;
            clientX = e.clientX; clientY = e.clientY; screenX = e.screenX; screenY = e.screenY;
        }

        // Update state coordinates
        this.vkMouse.state.lastX = clientX;
        this.vkMouse.state.lastY = clientY;

        return new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            screenX, screenY, clientX, clientY,
            ctrlKey: this.getModifierState(event, "Control"),
            shiftKey: this.getModifierState(event, "Shift"),
            altKey: this.getModifierState(event, "Alt"),
            metaKey: this.getModifierState(event, "Meta"),
            button: button,
            buttons: buttons
        });
    }

    mouseMove(event: TouchEvent | MouseEvent) {
        // For hover (ordinary move), buttons should be 0. 
        // For drag, buttons should be 1 (Left Click).
        const buttons = this.vkMouse.state.isDragging ? 1 : 0;
        const evt = this.createMouseEvent("mousemove", event, 0, buttons);
        (event.target as EventTarget)?.dispatchEvent(evt);
    }

    mouseDown(event: TouchEvent | MouseEvent, button: number = 0) {
        // button: 0=Left, 2=Right
        // buttons: 1=Left, 2=Right
        const buttons = button === 0 ? 1 : (button === 2 ? 2 : 0);
        const evt = this.createMouseEvent("mousedown", event, button, buttons);
        (event.target as EventTarget)?.dispatchEvent(evt);
    }

    mouseUp(event: TouchEvent | MouseEvent, button: number = 0) {
        const evt = this.createMouseEvent("mouseup", event, button, 0);
        (event.target as EventTarget)?.dispatchEvent(evt);
    }

    click(event: TouchEvent | MouseEvent) {
        const evt = this.createMouseEvent("click", event, 0, 0);
        (event.target as EventTarget)?.dispatchEvent(evt);
    }

    contextMenu(event: TouchEvent | MouseEvent) {
        const evt = this.createMouseEvent("contextmenu", event, 2, 2); // Right button
        (event.target as EventTarget)?.dispatchEvent(evt);
    }
}