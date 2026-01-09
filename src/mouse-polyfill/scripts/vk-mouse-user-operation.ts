import type { VkMouse } from "./vk-mouse";

export class VkMouseUserOperation {
    vkMouse: VkMouse;
    
    private startX: number = 0;
    private startY: number = 0;
    private hasMoved: boolean = false;
    
    private isDragging: boolean = false;
    private isDragPreparation: boolean = false;
    private isTwoFingerGesture: boolean = false;

    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }

    init() {
        const el = this.vkMouse.element;
        el.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
        el.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
        el.addEventListener("touchend", this.onTouchEnd.bind(this));
        el.addEventListener("touchcancel", this.onTouchEnd.bind(this));
    }

    private onTouchStart(event: TouchEvent) {
        if(event.cancelable) event.preventDefault();

        if (event.touches.length === 2) {
            this.isTwoFingerGesture = true;
            return;
        }

        if (event.touches.length > 1) return;

        const touch = event.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        this.startX = x;
        this.startY = y;
        this.hasMoved = false;
        this.isTwoFingerGesture = false;

        const now = Date.now();
        const timeSinceLastTap = now - this.vkMouse.state.lastTapEndTime;

        if (this.vkMouse.state.lastTapEndTime > 0 && timeSinceLastTap < this.vkMouse.state.DOUBLE_TAP_DELAY) {
            this.isDragging = true;
            this.isDragPreparation = true;
            
            this.vkMouse.eventDispatcher.dispatchMouseDown(x, y, false);
        } else {
            this.isDragging = false;
            this.isDragPreparation = false;
        }
    }

    private onTouchMove(event: TouchEvent) {
        if(event.cancelable) event.preventDefault();
        
        if (this.isTwoFingerGesture) return;

        const touch = event.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        const dx = x - this.startX;
        const dy = y - this.startY;

        if (!this.hasMoved) {
            if (Math.abs(dx) > this.vkMouse.state.MOVE_THRESHOLD || Math.abs(dy) > this.vkMouse.state.MOVE_THRESHOLD) {
                this.hasMoved = true;
            }
        }

        if (this.isDragging) {
            this.vkMouse.eventDispatcher.dispatchMouseMove(x, y, true);
        } else {
            this.vkMouse.eventDispatcher.dispatchMouseMove(x, y, false);
            
            if (this.hasMoved) {
                // If checking for drag gesture, movement breaks the double-click timer
                this.vkMouse.state.lastTapEndTime = 0;
            }
        }
    }

    private onTouchEnd(event: TouchEvent) {
        const touch = event.changedTouches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        if (this.isTwoFingerGesture) {
            if (event.touches.length === 0) {
                this.vkMouse.eventDispatcher.dispatchContextMenu(x, y);
                this.isTwoFingerGesture = false;
                this.isDragging = false;
                this.vkMouse.state.lastTapEndTime = 0;
            }
            return;
        }

        const now = Date.now();

        if (this.isDragging) {
            this.vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);
            this.vkMouse.eventDispatcher.dispatchClick(x, y);

            if (!this.hasMoved && this.isDragPreparation) {
                this.vkMouse.eventDispatcher.dispatchDblClick(x, y);
            }
            
            this.vkMouse.state.lastTapEndTime = 0;
            this.isDragging = false;
            this.isDragPreparation = false;
        } 
        else {
            if (!this.hasMoved) {
                this.vkMouse.eventDispatcher.dispatchMouseDown(x, y, false);
                this.vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);
                this.vkMouse.eventDispatcher.dispatchClick(x, y);

                this.vkMouse.state.lastTapEndTime = now;
            } else {
                this.vkMouse.state.lastTapEndTime = 0;
            }
        }
        
        this.hasMoved = false;
    }
}