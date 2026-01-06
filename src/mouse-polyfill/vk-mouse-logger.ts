export interface VkMouseLoggerConfig {
    enabled: boolean;
}

export class VkMouseLogger {
    private config: VkMouseLoggerConfig;
    
    constructor(config: VkMouseLoggerConfig) {
        this.config = config;
    }
    
    start() {
        if (!this.config.enabled) return;
        
        // Add event listeners to log mouse events
        document.addEventListener('mousedown', (e) => {
            this.log(`Mouse down at (${e.clientX}, ${e.clientY}) with button ${e.button}`);
        });
        
        document.addEventListener('mouseup', (e) => {
            this.log(`Mouse up at (${e.clientX}, ${e.clientY}) with button ${e.button}`);
        });
        
        document.addEventListener('mousemove', (e) => {
            this.log(`Mouse move to (${e.clientX}, ${e.clientY})`);
        });
        
        document.addEventListener('click', (e) => {
            this.log(`Click at (${e.clientX}, ${e.clientY})`);
        });
        
        document.addEventListener('contextmenu', (e) => {
            this.log(`Context menu at (${e.clientX}, ${e.clientY})`);
            // Prevent default context menu to avoid interference
            e.preventDefault();
        });
    }
    
    log(message: string) {
        if (!this.config.enabled) return;
        
        console.log(`[VkMouse] ${message}`);
        
        // Also try to write to a logger element if it exists
        const loggerElement = document.getElementById('logger');
        if (loggerElement) {
            loggerElement.innerHTML += `[VkMouse] ${message}<br>`;
        }
    }
}