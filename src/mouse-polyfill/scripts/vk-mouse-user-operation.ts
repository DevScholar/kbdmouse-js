import type { VkMouse } from "./vk-mouse";

export class VkMouseUserOperation {
    vkMouse: VkMouse;
    
    private timer: number | undefined;
    private startX: number = 0;
    private startY: number = 0;
    private hasMoved: boolean = false;
    private isLongPressActive: boolean = false; // True if long press timer triggered
    private isDragging: boolean = false; // True if we are sending drag events

    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
    }

    init() {
        const el = this.vkMouse.element;
        // Passive false is important to allow preventDefault if needed
        el.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
        el.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
        el.addEventListener("touchend", this.onTouchEnd.bind(this));
        el.addEventListener("touchcancel", this.onTouchEnd.bind(this));
    }

    private onTouchStart(event: TouchEvent) {
        // Prevent default browser zooming/scrolling behavior
        if(event.cancelable) event.preventDefault();

        if (event.touches.length > 1) return; // Ignore multi-touch for now

        const touch = event.touches[0];
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.hasMoved = false;
        this.isLongPressActive = false;
        this.isDragging = false;

        // Start Long Press Timer
        this.timer = window.setTimeout(() => {
            this.isLongPressActive = true;
            // Visual feedback could go here (e.g., navigator.vibrate)
            
            // Start of a drag operation involves holding the button down
            this.isDragging = true;
            this.vkMouse.eventDispatcher.dispatchMouseDown(this.startX, this.startY, false); // Left Down
        }, this.vkMouse.state.LONG_PRESS_DELAY);
    }

    private onTouchMove(event: TouchEvent) {
        if(event.cancelable) event.preventDefault();
        
        const touch = event.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        // Calculate distance
        const dx = x - this.startX;
        const dy = y - this.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Filter out small jitters
        if (dist > this.vkMouse.state.MOVE_THRESHOLD) {
            this.hasMoved = true;

            if (this.isLongPressActive) {
                // *** DRAG MODE ***
                // Long press triggered, so mouse is physically "down". 
                // We just move.
                this.vkMouse.eventDispatcher.dispatchMouseMove(x, y, true);
            } else {
                // *** HOVER MODE ***
                // We moved BEFORE long press triggered. Cancel timer.
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = undefined;
                }
                // Physically mouse is "up", just moving cursor
                this.vkMouse.eventDispatcher.dispatchMouseMove(x, y, false);
            }
        }
    }

    private onTouchEnd(event: TouchEvent) {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }

        // Use changedTouches because touches is empty on touchend
        const touch = event.changedTouches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        if (this.isLongPressActive) {
            if (this.isDragging && this.hasMoved) {
                // *** END DRAG ***
                // We were dragging, now we release
                this.vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);
                // Usually a 'click' event follows a release, but in drag-drop 
                // sometimes we only want up. Standard mouse emits click though.
                this.vkMouse.eventDispatcher.dispatchClick(x, y);
            } else {
                // *** RIGHT CLICK ***
                // Long press, but NO movement. 
                // Depending on logic, we already sent MouseDown (Left).
                // We need to clean that up or correct it.
                // WIN95 Style: Right click usually implies Context Menu.
                
                // Cleanup the Left Mouse Down we sent at timer trigger
                this.vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);

                // Dispatch Right Click Sequence
                this.vkMouse.eventDispatcher.dispatchMouseDown(x, y, true);
                this.vkMouse.eventDispatcher.dispatchMouseUp(x, y, true);
                this.vkMouse.eventDispatcher.dispatchContextMenu(x, y);
            }
        } else {
            // Short Tap
            if (!this.hasMoved) {
                // *** LEFT CLICK ***
                const now = Date.now();
                const isDouble = (now - this.vkMouse.state.lastClickTime) < this.vkMouse.state.DBL_CLICK_DELAY;
                
                this.vkMouse.eventDispatcher.dispatchMouseDown(x, y, false);
                this.vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);
                this.vkMouse.eventDispatcher.dispatchClick(x, y);

                if (isDouble) {
                    this.vkMouse.eventDispatcher.dispatchDblClick(x, y);
                    this.vkMouse.state.lastClickTime = 0; // Reset
                } else {
                    this.vkMouse.state.lastClickTime = now;
                }
            }
            // If hasMoved is true, it was just a Hover Move defined in onTouchMove, 
            // no clicks needed on release.
        }

        // Reset flags
        this.isLongPressActive = false;
        this.isDragging = false;
        this.hasMoved = false;
    }
}