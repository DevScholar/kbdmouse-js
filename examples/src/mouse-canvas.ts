class MouseCanvas {
    private mouseCanvas: HTMLCanvasElement;
    private lastX: number | null = null;
    private lastY: number | null = null;
    private currentColor: string;
    private currentState: DrawState;
    
    // Mapping states to colors
    private readonly COLOR_DICT = {
        "move": "black",
        "drag": "darkgray",
        "click": "red",
        "dblClick": "green",
        "rightClick": "blue",
    } as const;
    
    constructor(canvasId: string) {
        this.mouseCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.currentColor = this.COLOR_DICT.move;
        this.currentState = "move";
        this.init();
    }
    
    private clientXYtoCanvasXY(clientX: number, clientY: number) {
        let rect = this.mouseCanvas.getBoundingClientRect();
        let canvasX = clientX - rect.left;
        let canvasY = clientY - rect.top;
        return { canvasX, canvasY };
    }
    
    private drawCharacter(x: number, y: number, character: string, color: string) {
        const ctx = this.mouseCanvas.getContext("2d")!;
        ctx.font = "30px sans-serif";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(character, x, y);
    }
    
    private init() {
        this.mouseCanvas.addEventListener("mousemove", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            
            // Reset start point if mouse re-enters or just started
            if (this.lastX === null || this.lastY === null) {
                this.lastX = canvasX;
                this.lastY = canvasY;
                return; 
            }

            // Determine if button is held down (Drag vs Hover)
            if (event.buttons === 1) {
                this.currentState = "drag";
                this.currentColor = this.COLOR_DICT.drag;
            } else {
                this.currentState = "move";
                this.currentColor = this.COLOR_DICT.move;
            }

            const ctx = this.mouseCanvas.getContext("2d")!;
            ctx.beginPath();
            ctx.moveTo(this.lastX, this.lastY);
            ctx.lineTo(canvasX, canvasY);
            ctx.strokeStyle = this.currentColor;
            ctx.lineWidth = this.currentState === "drag" ? 4 : 2; // Thicker line for drag
            ctx.stroke();
            
            this.lastX = canvasX;
            this.lastY = canvasY;
        });

        this.mouseCanvas.addEventListener("mousedown", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            this.lastX = canvasX;
            this.lastY = canvasY;
        });

        this.mouseCanvas.addEventListener("mouseleave", () => {
            this.lastX = null; 
            this.lastY = null;
        });

        this.mouseCanvas.addEventListener("mouseenter", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            this.lastX = canvasX;
            this.lastY = canvasY;
        });

        this.mouseCanvas.addEventListener("click", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            this.drawCharacter(canvasX, canvasY, "←", this.COLOR_DICT.click);
        });

        this.mouseCanvas.addEventListener("dblclick", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            // Draw slightly offset so it doesn't perfectly overlap the click
            this.drawCharacter(canvasX + 10, canvasY - 10, "⇇", this.COLOR_DICT.dblClick);
        });

        this.mouseCanvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            this.drawCharacter(canvasX, canvasY, "→", this.COLOR_DICT.rightClick);
        });
    }
    
    clearCanvas() {
        const ctx = this.mouseCanvas.getContext("2d")!;
        ctx.clearRect(0, 0, this.mouseCanvas.width, this.mouseCanvas.height);
    }
}

type DrawState = keyof {
    "move": "black";
    "drag": "darkgray";
    "click": "red";
    "dblClick": "green";
    "rightClick": "blue";
};

// Initialize
const mouseCanvasInstance = new MouseCanvas("mouse-canvas");
(window as any).clearCanvas = () => mouseCanvasInstance.clearCanvas();