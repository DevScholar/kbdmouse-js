import type { VkMouse } from './vk-mouse';

export class VkMouseUserOperation {
    // WeakRef: element 上的 listener 闭包持有 this，但 this 只弱引用 VkMouse，
    // 因此用户将 vkMouse 变量置 null 后，VkMouse 可被 GC，
    // 下次 touch 事件触发时 deref() 返回 undefined，自动调用 remove() 完成清理。
    private vkMouseRef: WeakRef<VkMouse>;

    private startX: number = 0;
    private startY: number = 0;
    private hasMoved: boolean = false;

    private isDragging: boolean = false;
    private isDragPreparation: boolean = false;
    private isTwoFingerGesture: boolean = false;
    private hasTwoFingerScrolled: boolean = false;

    private abortController: AbortController | null = null;

    constructor(vkMouse: VkMouse) {
        this.vkMouseRef = new WeakRef(vkMouse);
    }

    private get vkMouse(): VkMouse | null {
        return this.vkMouseRef.deref() ?? null;
    }

    init() {
        this.remove();
        const vkMouse = this.vkMouse;
        if (!vkMouse) return;
        this.abortController = new AbortController();
        const { signal } = this.abortController;
        const el = vkMouse.element;
        el.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false, signal });
        el.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false, signal });
        el.addEventListener('touchend', (e) => this.onTouchEnd(e), { signal });
        el.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { signal });
    }

    remove() {
        this.abortController?.abort();
        this.abortController = null;
    }

    attach() {
        this.init();
    }

    private getTwoFingerCenter(event: TouchEvent): { x: number; y: number } {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
        };
    }

    private onTouchStart(event: TouchEvent) {
        const vkMouse = this.vkMouse;
        if (!vkMouse) { this.remove(); return; }

        if (event.cancelable) event.preventDefault();

        if (event.touches.length === 2) {
            this.isTwoFingerGesture = true;
            this.hasTwoFingerScrolled = false;
            const center = this.getTwoFingerCenter(event);
            vkMouse.state.twoFingerStartX = center.x;
            vkMouse.state.twoFingerStartY = center.y;
            vkMouse.state.lastTwoFingerX = center.x;
            vkMouse.state.lastTwoFingerY = center.y;
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
        const timeSinceLastTap = now - vkMouse.state.lastTapEndTime;

        if (
            vkMouse.state.lastTapEndTime > 0 &&
            timeSinceLastTap < vkMouse.state.DOUBLE_TAP_DELAY
        ) {
            this.isDragging = true;
            this.isDragPreparation = true;
            vkMouse.eventDispatcher.dispatchMouseDown(x, y, false);
        } else {
            this.isDragging = false;
            this.isDragPreparation = false;
        }
    }

    private onTouchMove(event: TouchEvent) {
        const vkMouse = this.vkMouse;
        if (!vkMouse) { this.remove(); return; }

        if (event.cancelable) event.preventDefault();

        if (this.isTwoFingerGesture) {
            if (event.touches.length === 2) {
                const center = this.getTwoFingerCenter(event);
                const lastX = vkMouse.state.lastTwoFingerX;
                const lastY = vkMouse.state.lastTwoFingerY;

                const deltaX = center.x - lastX;
                const deltaY = center.y - lastY;

                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    this.hasTwoFingerScrolled = true;
                    vkMouse.eventDispatcher.dispatchWheel(
                        center.x,
                        center.y,
                        deltaX * vkMouse.state.SCROLL_MULTIPLIER,
                        deltaY * vkMouse.state.SCROLL_MULTIPLIER
                    );
                }

                vkMouse.state.lastTwoFingerX = center.x;
                vkMouse.state.lastTwoFingerY = center.y;
            }
            return;
        }

        const touch = event.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        const dx = x - this.startX;
        const dy = y - this.startY;

        if (!this.hasMoved) {
            if (
                Math.abs(dx) > vkMouse.state.MOVE_THRESHOLD ||
                Math.abs(dy) > vkMouse.state.MOVE_THRESHOLD
            ) {
                this.hasMoved = true;
            }
        }

        if (this.isDragging) {
            vkMouse.eventDispatcher.dispatchMouseMove(x, y, true);
        } else {
            vkMouse.eventDispatcher.dispatchMouseMove(x, y, false);
            if (this.hasMoved) {
                vkMouse.state.lastTapEndTime = 0;
            }
        }
    }

    private onTouchEnd(event: TouchEvent) {
        const vkMouse = this.vkMouse;
        if (!vkMouse) { this.remove(); return; }

        const touch = event.changedTouches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        if (this.isTwoFingerGesture) {
            if (event.touches.length === 0) {
                if (!this.hasTwoFingerScrolled) {
                    vkMouse.eventDispatcher.dispatchContextMenu(x, y);
                }
                this.isTwoFingerGesture = false;
                this.hasTwoFingerScrolled = false;
                this.isDragging = false;
                vkMouse.state.lastTapEndTime = 0;
            }
            return;
        }

        const now = Date.now();

        if (this.isDragging) {
            vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);
            vkMouse.eventDispatcher.dispatchClick(x, y);

            if (!this.hasMoved && this.isDragPreparation) {
                vkMouse.eventDispatcher.dispatchDblClick(x, y);
            }

            vkMouse.state.lastTapEndTime = 0;
            this.isDragging = false;
            this.isDragPreparation = false;
        } else {
            if (!this.hasMoved) {
                vkMouse.eventDispatcher.dispatchMouseDown(x, y, false);
                vkMouse.eventDispatcher.dispatchMouseUp(x, y, false);
                vkMouse.eventDispatcher.dispatchClick(x, y);
                vkMouse.state.lastTapEndTime = now;
            } else {
                vkMouse.state.lastTapEndTime = 0;
            }
        }

        this.hasMoved = false;
    }
}
