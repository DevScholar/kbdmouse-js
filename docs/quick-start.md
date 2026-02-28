# Quick Start Guide

KBDMouseJS is a polyfill that enables mouse and keyboard events on mobile devices. It's perfect for running x86 emulators (like Windows 95) or using old web pages that rely on traditional mouse/keyboard interactions.

---

## Prerequisites

- A modern web browser
- A mobile device (or touch simulator) for testing
- Node.js 18+ (for development)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-repo/kbdmouse-js.git
cd kbdmouse-js
npm install
```

---

## Quick Demo

Start the development server exposed to your local network:

```bash
npm run dev:expose
```

This makes the webpage accessible to other devices on your network. Connect your phone to your computer's hotspot, then open the displayed URL on your phone.

---

## Usage

### 1. Virtual Keyboard

Add the keyboard stylesheet and script to your HTML, then include the `<virtual-keyboard>` custom element:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="src/virtual-keyboard/styles/vk-keyboard.css">
</head>
<body>
    <!-- Your content here -->

    <virtual-keyboard></virtual-keyboard>

    <script type="module" src="src/virtual-keyboard/scripts/vk-keyboard.ts"></script>
</body>
</html>
```

The virtual keyboard will automatically appear at the bottom of the screen on touch devices.

---

### 2. Virtual Mouse Polyfill

The mouse polyfill converts touch gestures into standard DOM mouse events.

**HTML:**

```html
<script type="module" src="src/mouse-polyfill/scripts/vk-mouse.ts"></script>
<script type="module">
    import { VkMouse } from "./src/mouse-polyfill/scripts/vk-mouse.ts";

    document.addEventListener("DOMContentLoaded", function () {
        let element = document.getElementById("polyfilled-element");
        if (element) {
            let vkMouse = new VkMouse(element);
        }
    });
</script>
```

**Apply to your element:**

```html
<div id="polyfilled-element">
    <!-- Content that needs mouse events -->
</div>
```

---

## Gesture Reference

The mouse polyfill works like a **Windows Precision Touchpad**:

| Gesture | Action |
|---------|--------|
| Slide one finger | Move / Hover |
| Single tap (one finger) | Left Click |
| Single tap (two fingers) | Right Click |
| Double tap (one finger) | Double Click |
| Tap → lift → tap & hold → drag | Drag (Tap-and-a-Half gesture) |

> **Note:** HTML5 drag-and-drop events are not supported. For that, use [drag-drop-touch-js](https://github.com/drag-drop-touch-js/dragdroptouch) alongside this library.

---

## Building

### Standard Build (minified)

```bash
npm run build
```

### Build Without Packaging (preserves module structure, no compression)

```bash
npm run build:noPackaging
```

---

## Examples

Check the `examples/` directory for working demos:

- `examples/src/drag-div.ts` - Drag and drop demo
- `examples/src/mouse-canvas.ts` - Canvas drawing demo

Run the examples with:

```bash
npm run dev
```

---

## Troubleshooting

### Virtual keyboard not appearing?

- Ensure you're viewing the page on a touch device or using browser dev tools mobile simulation
- Check that the CSS and JS files are loading correctly (check Network tab)

### Mouse events not working?

- Make sure the target element has proper dimensions (width/height set)
- Verify the element ID matches what you pass to `VkMouse`
- Check browser console for errors

### Need more help?

See the [FAQ](faq.md) for common questions.
