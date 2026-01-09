Here is the updated `README.md`. I have completely rewritten the **Virtual Mouse** section to describe the new Windows Precision Touchpad behaviors (Tap-and-a-Half dragging, Two-Finger right click, etc.).

```markdown
# KBDMouseJS

⚠️ This project is still in pre-alpha stage, and API is subject to change.
This project is focused on retro computing, that is, compatibility with old web pages and professional emulators. See [FAQ](docs/faq.md) for more details.

## Introduction

This project is a polyfill that provides mouse and keyboard events for mobile
devices (such as phones) to address the issue of these events not being
supported on mobile. For example, an x86 emulator running Windows 95 in a web page may
require keyboard and mouse events to function. Similarly, some old web pages'
drag-and-drop features might not have taken mobile touch events into account.
This project addresses the issue by provide a virtual ANSI keyboard and convert touch events into standard DOM mouse events.

Use `npm run dev:expose` to expose the webpage to the local network.

(for example, connect your computer to your phone's hotspot and open the webpage on
your phone).

## Usage

### Virtual Keyboard

```html
<link rel="stylesheet" href="src/virtual-keyboard/styles/vk-keyboard.css">
<script type="module" src="src/virtual-keyboard/scripts/vk-keyboard.ts"></script
>
<virtual-keyboard></virtual-keyboard>
```

### Virtual Mouse

#### Notice:

The mouse polyfill controls now logic resemble a **Windows Precision Touchpad**:

*   **Move / Hover:** Slide one finger on the screen.
*   **Left Click:** Single tap with one finger.
*   **Right Click:** Single tap with **two fingers**.
*   **Double Click:** Double tap with one finger.
*   **Drag (Left Button Down + Move):** Tap once, lift, then quickly tap again and hold while moving (The "Tap-and-a-Half" gesture).

Note: This project will not support HTML 5 drag-and-drop events. If you want them, use [drag-drop-touch-js](https://github.com/drag-drop-touch-js/dragdroptouch) instead. 
```html
<script type="module" src="src/mouse-polyfill/scripts/vk-mouse.ts"></script>
<script type="module">
    import { VkMouse } from "./src/mouse-polyfill/scripts/vk-mouse.ts";

    document.addEventListener("DOMContentLoaded", function () {
        let element = document.getElementById("polyfilled-element");
        if (element) {
            let vkMouse = new VkMouse(element);
        } else {
            console.error("polyfilled-element element not found");
        }
    });
</script>
```

## Building

### Standard Build

```bash
npm run build
```

### Library Mode Build (compressed and optimized)

```bash
npm run build:lib
```

### Build Without Packaging (keeps module structure, no compression)

```bash
npm run build:noPackaging
```


## License

MIT License
```