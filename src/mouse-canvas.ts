class MouseCanvas {
    private mouseCanvas: HTMLCanvasElement;
    private lastX: number | null = null;
    private lastY: number | null = null;
    private currentColor: string;
    private currentState: DrawState;
    
    private readonly COLOR_DICT = {
        "move": "black",
        "drag": "blue",
        "click": "green",
        "dblClick": "yellow",
        "rightClick": "purple",
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
    
    private drawPoint(x: number, y: number, color: string) {
        const ctx = this.mouseCanvas.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    private init() {
        this.mouseCanvas.addEventListener("mousemove", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            
            if (this.lastX === null || this.lastY === null) {
                this.lastX = canvasX;
                this.lastY = canvasY;
                return; 
            }

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
            ctx.lineWidth = this.currentState === "drag" ? 3 : 1;
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
            this.drawPoint(canvasX, canvasY, this.COLOR_DICT.click);
        });

        this.mouseCanvas.addEventListener("dblclick", (event) => {
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            this.drawPoint(canvasX, canvasY, this.COLOR_DICT.dblClick);
        });

        this.mouseCanvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            const { canvasX, canvasY } = this.clientXYtoCanvasXY(event.clientX, event.clientY);
            this.drawPoint(canvasX, canvasY, this.COLOR_DICT.rightClick);
        });
    }
    
    clearCanvas() {
        const ctx = this.mouseCanvas.getContext("2d")!;
        ctx.clearRect(0, 0, this.mouseCanvas.width, this.mouseCanvas.height);
    }
}

type DrawState = keyof {
    "move": "black";
    "drag": "blue";
    "click": "green";
    "dblClick": "yellow";
    "rightClick": "purple";
};

const mouseCanvasInstance = new MouseCanvas("mouse-canvas");
(window as any).clearCanvas = () => mouseCanvasInstance.clearCanvas();