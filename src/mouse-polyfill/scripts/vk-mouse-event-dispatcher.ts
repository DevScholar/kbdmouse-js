import type { VkMouse } from './vk-mouse';

// The legacy wheel members report one notch as 120 where the standard delta is
// 100, and they point the other way. A client that was written for a mechanical
// wheel reads them, and Chromium copies deltaY into wheelDelta for a constructed
// event with the same sign, so the pair is written here instead of trusted
const LEGACY_WHEEL_SCALE = 120 / 100;

export class VkMouseEventDispatcher {
    vkMouse: VkMouse;

    private lastDispatchX: number | null = null;
    private lastDispatchY: number | null = null;

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

    private createEvent(
        type: string,
        x: number,
        y: number,
        buttons: number,
        button: number,
        movementX: number = 0,
        movementY: number = 0
    ) {
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
            movementX: movementX,
            movementY: movementY,
        });
    }

    dispatchMouseMove(x: number, y: number, isLeftButtonDown: boolean) {
        const { x: clampedX, y: clampedY } = this.clampToViewport(x, y);
        // movementX and movementY are the distance from the previous position,
        // which is what a desktop pointer reports and what a client that turns
        // the pointer into relative motion reads
        const movementX = this.lastDispatchX === null ? 0 : clampedX - this.lastDispatchX;
        const movementY = this.lastDispatchY === null ? 0 : clampedY - this.lastDispatchY;

        this.lastDispatchX = clampedX;
        this.lastDispatchY = clampedY;

        const buttons = isLeftButtonDown ? 1 : 0;
        const target = this.getTarget(clampedX, clampedY);
        target.dispatchEvent(
            this.createEvent('mousemove', clampedX, clampedY, buttons, 0, movementX, movementY)
        );
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

        // The legacy members are what a client written for a mechanical wheel
        // reads, and a two finger slide has to look the same to it as a real
        // one does
        Object.defineProperties(wheelEvent, {
            wheelDelta: { value: -deltaY * LEGACY_WHEEL_SCALE },
            wheelDeltaX: { value: -deltaX * LEGACY_WHEEL_SCALE },
            wheelDeltaY: { value: -deltaY * LEGACY_WHEEL_SCALE },
        });

        target.dispatchEvent(wheelEvent);
    }
}
