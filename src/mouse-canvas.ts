let mouseCanvas = document.getElementById("mouse-canvas") as HTMLCanvasElement;

function clientXYtoCanvasXY(clientX: number, clientY: number) {
    let rect = mouseCanvas.getBoundingClientRect();
    let canvasX = clientX - rect.left;
    let canvasY = clientY - rect.top;
    return { canvasX, canvasY };
}

let lastX: number | null = null;
let lastY: number | null = null;

const COLOR_DICT = {
    "move": "black",
    "drag": "blue",
    "click": "green",
    "dblClick": "yellow",
    "rightClick": "purple",
};

type DrawState = keyof typeof COLOR_DICT;
let currentColor = COLOR_DICT.move;
let currentState: DrawState = "move";

function drawPoint(x: number, y: number, color: string) {
    const ctx = mouseCanvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

mouseCanvas.addEventListener("mousemove", (event) => {
    const { canvasX, canvasY } = clientXYtoCanvasXY(event.clientX, event.clientY);
    
    if (lastX === null || lastY === null) {
        lastX = canvasX;
        lastY = canvasY;
        return; 
    }

    if (event.buttons === 1) {
        currentState = "drag";
        currentColor = COLOR_DICT.drag;
    } else {
        currentState = "move";
        currentColor = COLOR_DICT.move;
    }

    const ctx = mouseCanvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(canvasX, canvasY);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentState === "drag" ? 3 : 1;
    ctx.stroke();
    
    lastX = canvasX;
    lastY = canvasY;
});


mouseCanvas.addEventListener("mousedown", (event) => {
    const { canvasX, canvasY } = clientXYtoCanvasXY(event.clientX, event.clientY);
    lastX = canvasX;
    lastY = canvasY;
});

mouseCanvas.addEventListener("mouseleave", () => {
    lastX = null; 
    lastY = null;
});

mouseCanvas.addEventListener("mouseenter", (event) => {
    const { canvasX, canvasY } = clientXYtoCanvasXY(event.clientX, event.clientY);
    lastX = canvasX;
    lastY = canvasY;
});

mouseCanvas.addEventListener("click", (event) => {
    const { canvasX, canvasY } = clientXYtoCanvasXY(event.clientX, event.clientY);
    drawPoint(canvasX, canvasY, COLOR_DICT.click);
});

mouseCanvas.addEventListener("dblclick", (event) => {
    const { canvasX, canvasY } = clientXYtoCanvasXY(event.clientX, event.clientY);
    drawPoint(canvasX, canvasY, COLOR_DICT.dblClick);
});

mouseCanvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const { canvasX, canvasY } = clientXYtoCanvasXY(event.clientX, event.clientY);
    drawPoint(canvasX, canvasY, COLOR_DICT.rightClick);
});

function clearCanvas() {
    const ctx = mouseCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, mouseCanvas.width, mouseCanvas.height);
}

(window as any).clearCanvas = clearCanvas;