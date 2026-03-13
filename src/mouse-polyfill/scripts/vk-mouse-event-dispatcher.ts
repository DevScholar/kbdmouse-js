import type { VkMouse } from './vk-mouse';

export class VkMouseEventDispatcher {
    vkMouse: VkMouse;

    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }

    private getTarget(x: number, y: number): Element {
        const clampedX = Math.max(0, Math.min(x, window.innerWidth - 1));
        const clampedY = Math.max(0, Math.min(y, window.innerHeight - 1));
        const target = document.elementFromPoint(clampedX, clampedY);
        if (!target) {
            return this.vkMouse.element;
        }
        return target;
    }

    private clampToViewport(x: number, y: number): { x: number; y: number } {
        return {
            x: Math.max(0, Math.min(x, window.innerWidth - 1)),
            y: Math.max(0, Math.min(y, window.innerHeight - 1)),
        };
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
            button: button,
        });
    }

    dispatchMouseMove(x: number, y: number, isLeftButtonDown: boolean) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const buttons = isLeftButtonDown ? 1 : 0;
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(this.createEvent('mousemove', clampedX, clampedY, buttons, 0));
    }

    dispatchMouseDown(x: number, y: number, isRightClick: boolean = false) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const button = isRightClick ? 2 : 0;
        const buttons = isRightClick ? 2 : 1;
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(this.createEvent('mousedown', clampedX, clampedY, buttons, button));
    }

    dispatchMouseUp(x: number, y: number, isRightClick: boolean = false) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const button = isRightClick ? 2 : 0;
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(this.createEvent('mouseup', clampedX, clampedY, 0, button));
    }

    dispatchClick(x: number, y: number) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(this.createEvent('click', clampedX, clampedY, 0, 0));
    }

    dispatchDblClick(x: number, y: number) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(this.createEvent('dblclick', clampedX, clampedY, 0, 0));
    }

    dispatchContextMenu(x: number, y: number) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(this.createEvent('contextmenu', clampedX, clampedY, 2, 2));
    }

    dispatchWheel(x: number, y: number, deltaX: number, deltaY: number) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        const target = this.getTarget(clampedX, clampedY);
        const wheelEvent = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clampedX,
            clientY: clampedY,
            screenX: clampedX,
            screenY: clampedY,
            deltaX: deltaX,
            deltaY: deltaY,
            deltaZ: 0,
            deltaMode: 0,
        });
        target.dispatchEvent(wheelEvent);
    }
}
