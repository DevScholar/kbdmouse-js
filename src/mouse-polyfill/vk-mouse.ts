import { VkMouseEventDispatcher } from "./vk-mouse-event-dispatcher";
import { VkMouseState } from "./vk-mouse-state";
import { VkMouseUserOperation } from "./vk-mouse-user-operation";

export interface VkMouseConfig {
    vibrateEnabled?: boolean;
    debugEnabled?: boolean;
    dragThresholdTime?: number;      // default: 600
    rightClickThresholdTime?: number; // default: 600
    doubleClickWindow?: number;
    moveThresholdDistance?: number;
}

export class VkMouse {
    // Config storage
    public config: Required<VkMouseConfig>;
    
    // Modules
    eventDispatcher!: VkMouseEventDispatcher;
    state!: VkMouseState;
    userOperation!: VkMouseUserOperation;
    element!: HTMLElement;

    constructor(element: HTMLElement, config: VkMouseConfig = {}) {
        this.element = element;
        this.config = {
            vibrateEnabled: config.vibrateEnabled ?? true,
            debugEnabled: config.debugEnabled ?? false,
            // User requested 600ms threshold for drag/right-click logic
            dragThresholdTime: config.dragThresholdTime ?? 600, 
            rightClickThresholdTime: config.rightClickThresholdTime ?? 600,
            doubleClickWindow: config.doubleClickWindow ?? 300,
            moveThresholdDistance: config.moveThresholdDistance ?? 10
        };
        
        this.eventDispatcher = new VkMouseEventDispatcher(this);
        this.state = new VkMouseState(this);
        this.userOperation = new VkMouseUserOperation(this);
        
        this.preventBrowserDefaultGestures();
    }

    get vibrationEnabled(): boolean {
        return this.config.vibrateEnabled;
    }
    
    set vibrationEnabled(enabled: boolean) {
        this.config.vibrateEnabled = enabled;
    }
    
    get dragThresholdTime(): number {
        return this.config.dragThresholdTime;
    }
    
    get rightClickThresholdTime(): number {
        return this.config.rightClickThresholdTime;
    }
    
    get doubleClickWindow(): number {
        return this.config.doubleClickWindow;
    }
    
    get moveThresholdDistance(): number {
        return this.config.moveThresholdDistance;
    }

    preventBrowserDefaultGestures() {
        this.element.addEventListener("touchstart", (e) => {
            e.preventDefault();
        }, { passive: false });
        this.element.addEventListener("touchmove", (e) => {
            e.preventDefault();
        }, { passive: false });
        this.element.addEventListener("touchend", (e) => {
            e.preventDefault();
        }, { passive: false });
        this.element.addEventListener("touchcancel", (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    vibrate(duration: number = 30): void {
        if (this.config.vibrateEnabled && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }
}