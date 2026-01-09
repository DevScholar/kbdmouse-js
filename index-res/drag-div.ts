// Classic HTML4 Drag and Drop logic
const box = document.getElementById('classic-draggable');
const area = document.getElementById('drag-test-area');

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

if (box && area) {
    box.addEventListener('mousedown', (e) => {
        isDragging = true;

        const rect = box.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;

        box.style.backgroundColor = '#2196F3'; // Blue
        box.textContent = "Dragging...";
        e.preventDefault(); // Prevent text selection
    });

    area.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const areaRect = area.getBoundingClientRect();

        // Calculate new position relative to the container
        let newLeft = e.clientX - areaRect.left - dragOffsetX;
        let newTop = e.clientY - areaRect.top - dragOffsetY;

        box.style.left = newLeft + 'px';
        box.style.top = newTop + 'px';
    });

    // We attach mouseup to document to catch drops outside the box
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            box.style.backgroundColor = '#ff4444'; // Red
            box.textContent = "Drag Me";
        }
    });
}