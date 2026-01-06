import { VkMouse } from "./vk-mouse";

export class VkMouseUserOperation {
    private longPressTimer: any = null;

    constructor(vkMouse: VkMouse) {
        this.vkMouse = vkMouse;
        this.setupListeners();
    }

    vkMouse: VkMouse;

    private setupListeners() {
        const el = this.vkMouse.element;
        // Use passive: false to allow preventDefault
        el.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        el.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        el.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        el.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
    }

    private clearTimer() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    private handleTouchStart(e: TouchEvent) {
        // 1. Reset State
        this.clearTimer();
        const touch = e.touches[0];
        
        this.vkMouse.state.mode = "touching";
        this.vkMouse.state.touchStartTime = Date.now();
        this.vkMouse.state.hasMovedSignificantDistance = false;
        this.vkMouse.state.isDragging = false;
        
        // Record start position
        this.vkMouse.state.startX = touch.clientX;
        this.vkMouse.state.startY = touch.clientY;
        this.vkMouse.state.lastX = touch.clientX;
        this.vkMouse.state.lastY = touch.clientY;

        // Log touch start
        if (this.vkMouse.config.debugEnabled) {
            this.log(`polyfill touch start at (${touch.clientX}, ${touch.clientY})`);
        }

        // 2. Start Long Press Timer
        // Key modification: When timer triggers, don't immediately trigger right-click,
        // instead enter a pending state
        this.longPressTimer = setTimeout(() => {
            if (this.vkMouse.state.mode === "touching" && !this.vkMouse.state.hasMovedSignificantDistance) {
                // Time > 600ms, and no movement -> mark as long press ready
                
                // Don't trigger any events yet! Just mark the state.
                this.vkMouse.state.mode = "long-pressed"; 
                
                if (this.vkMouse.config.debugEnabled) {
                    this.log(`polyfill long press detected at (${touch.clientX}, ${touch.clientY})`);
                }
            }
        }, this.vkMouse.config.rightClickThresholdTime);
    }

    private handleTouchMove(e: TouchEvent) {
        // If already completed right-click menu, ignore
        if (this.vkMouse.state.mode === "right-click-done") return;

        const touch = e.touches[0];
        
        // Check micro-shake
        if (!this.vkMouse.state.checkMoved(touch.clientX, touch.clientY)) {
            return; 
        }

        // Once there is significant movement, clear the long press timer (if not triggered yet)
        this.clearTimer();

        // Get current state
        const currentMode = this.vkMouse.state.mode;

        // Logic branches:
        
        // Case A: Already in long-press state ("long-pressed"), user starts moving -> This is a DRAG
        if (currentMode === "long-pressed") {
            if (!this.vkMouse.state.isDragging) {
                this.vkMouse.state.mode = "dragging";
                this.vkMouse.state.isDragging = true;
                // Trigger left mouse down to start drag
                this.vkMouse.eventDispatcher.mouseDown(e, 0); 
                
                // Log drag start
                if (this.vkMouse.config.debugEnabled) {
                    this.log(`polyfill drag start at (${touch.clientX}, ${touch.clientY})`);
                }
            }
            this.vkMouse.eventDispatcher.mouseMove(e);
            return;
        }

        // Case B: Already dragging -> Continue moving
        if (this.vkMouse.state.mode === "dragging") {
            this.vkMouse.eventDispatcher.mouseMove(e);
            return;
        }

        // Case C: Timer hasn't triggered yet but moved (quick swipe)
        // Check if time satisfies drag threshold (if quick swipe, then becomes Hover)
        const duration = Date.now() - this.vkMouse.state.touchStartTime;
        
        if (duration > this.vkMouse.config.dragThresholdTime) {
            // This is usually the case that "long-pressed" covers, but retain for defensive programming
             if (!this.vkMouse.state.isDragging) {
                this.vkMouse.state.mode = "dragging";
                this.vkMouse.state.isDragging = true;
                this.vkMouse.eventDispatcher.mouseDown(e, 0);
                
                // Log drag start
                if (this.vkMouse.config.debugEnabled) {
                    this.log(`polyfill drag start at (${touch.clientX}, ${touch.clientY})`);
                }
            }
            this.vkMouse.eventDispatcher.mouseMove(e);
        } else {
            // Normal move (Hover)
            if (this.vkMouse.state.mode !== "hover-moving") {
                this.vkMouse.state.mode = "hover-moving";
                
                // Log mouse move start
                if (this.vkMouse.config.debugEnabled) {
                    this.log(`polyfill ordinary mouse move start at (${touch.clientX}, ${touch.clientY})`);
                }
            }
            this.vkMouse.eventDispatcher.mouseMove(e);
        }
    }

    private handleTouchEnd(e: TouchEvent) {
        this.clearTimer();
        const currentTime = Date.now();
        const currentMode = this.vkMouse.state.mode;
        const touch = e.changedTouches.length > 0 ? e.changedTouches[0] : null;

        switch (currentMode) {
            case "dragging":
                // End Drag: Release Left Button
                this.vkMouse.eventDispatcher.mouseUp(e, 0);
                
                // Log drag end
                if (this.vkMouse.config.debugEnabled && touch) {
                    this.log(`polyfill drag end at (${touch.clientX}, ${touch.clientY})`);
                }
                
                this.vkMouse.state.reset();
                break;

            case "long-pressed":
                // Long pressed, but lifted without moving -> This is a RIGHT-CLICK / CONTEXT MENU
                this.vkMouse.eventDispatcher.mouseDown(e, 2); // Right Mouse Down
                this.vkMouse.eventDispatcher.mouseUp(e, 2);   // Right Mouse Up
                this.vkMouse.eventDispatcher.contextMenu(e);  // Context Menu
                
                // Log right-click
                if (this.vkMouse.config.debugEnabled && touch) {
                    this.log(`polyfill right click at (${touch.clientX}, ${touch.clientY})`);
                }
                
                this.vkMouse.state.mode = "right-click-done";
                // Don't call reset, wait for next click to reset, or reset manually
                this.vkMouse.state.reset();
                break;

            case "hover-moving":
                // Log mouse move end
                  if (this.vkMouse.config.debugEnabled && touch) {
                      this.log(`polyfill ordinary mouse move end at (${touch.clientX}, ${touch.clientY})`);
                  }
                this.vkMouse.state.reset();
                break;

            case "touching":
                // Normal click logic (short press)
                const timeSinceLastClick = currentTime - this.vkMouse.state.lastClickTime;
                
                if (timeSinceLastClick < this.vkMouse.config.doubleClickWindow) {
                    this.performClickSequence(e);
                    this.performClickSequence(e); 
                    
                    // Log double click
                      if (this.vkMouse.config.debugEnabled && touch) {
                          this.log(`polyfill dblclick at (${touch.clientX}, ${touch.clientY})`);
                      }
                } else {
                    this.performClickSequence(e);
                    
                    // Log click
                      if (this.vkMouse.config.debugEnabled && touch) {
                          this.log(`polyfill click at (${touch.clientX}, ${touch.clientY})`);
                      }
                }
                
                this.vkMouse.state.lastClickTime = currentTime;
                this.vkMouse.state.reset();
                break;
                
            case "right-click-done":
                this.vkMouse.state.reset();
                break;
                
            default:
                this.vkMouse.state.reset();
                break;
        }
    }

    private performClickSequence(e: TouchEvent) {
        const touch = e.changedTouches.length > 0 ? e.changedTouches[0] : null;
        
        this.vkMouse.eventDispatcher.mouseDown(e, 0);
        this.vkMouse.eventDispatcher.mouseUp(e, 0);
        this.vkMouse.eventDispatcher.click(e);
        
        // Log click event if debug is enabled
        if (this.vkMouse.config.debugEnabled && touch) {
            this.log(`polyfill click at (${touch.clientX}, ${touch.clientY})`);
        }
    }
    
    private log(message: string) {
        console.log(message);
        
        // Also try to write to a logger element if it exists
        const loggerElement = document.getElementById('logger');
        if (loggerElement) {
            loggerElement.innerHTML += message + '<br>';
        }
    }
}