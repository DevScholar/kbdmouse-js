import type { VkMouse } from "./vk-mouse";

export class VkMouseUserOperation {
    vkMouse: VkMouse;
    
    private startX: number = 0;
    private startY: number = 0;
    private hasMoved: boolean = false;
    
    private isDragging: boolean = false;
    private isDragPreparation: boolean = false;
    private isTwoFingerGesture: boolean = false;
    private hasTwoFingerScrolled: boolean = false;

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

    private getTwoFingerCenter(event: TouchEvent): { x: number; y: number } {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    private onTouchStart(event: TouchEvent) {
        if(event.cancelable) event.preventDefault();

        if (event.touches.length === 2) {
            this.isTwoFingerGesture = true;
            this.hasTwoFingerScrolled = false;
            const center = this.getTwoFingerCenter(event);
            this.vkMouse.state.twoFingerStartX = center.x;
            this.vkMouse.state.twoFingerStartY = center.y;
            this.vkMouse.state.lastTwoFingerX = center.x;
            this.vkMouse.state.lastTwoFingerY = center.y;
            return;
        }

        if (event.touches.length > 2) return;

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
        
        if (this.isTwoFingerGesture) {
            if (event.touches.length === 2) {
                const center = this.getTwoFingerCenter(event);
                const lastX = this.vkMouse.state.lastTwoFingerX;
                const lastY = this.vkMouse.state.lastTwoFingerY;
                
                const deltaX = lastX - center.x;
                const deltaY = lastY - center.y;
                
                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    this.hasTwoFingerScrolled = true;
                    this.vkMouse.eventDispatcher.dispatchWheel(
                        center.x,
                        center.y,
                        deltaX * this.vkMouse.state.SCROLL_MULTIPLIER,
                        deltaY * this.vkMouse.state.SCROLL_MULTIPLIER
                    );
                }
                
                this.vkMouse.state.lastTwoFingerX = center.x;
                this.vkMouse.state.lastTwoFingerY = center.y;
            }
            return;
        }

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
                if (!this.hasTwoFingerScrolled) {
                    this.vkMouse.eventDispatcher.dispatchContextMenu(x, y);
                }
                this.isTwoFingerGesture = false;
                this.hasTwoFingerScrolled = false;
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
