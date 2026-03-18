# KBDMouseJS

This project is focused on retro computing, that is, compatibility with old web pages and professional emulators. See [FAQ](docs/faq.md) for more details.

# Introduction

This project is a polyfill that provides mouse and keyboard events for mobile
devices (such as phones) to address the issue of these events not being
supported on mobile. For example, an x86 emulator running Windows 95 in a web page may
require keyboard and mouse events to function. Similarly, some old web pages'
drag-and-drop features might not have taken mobile touch events into account.
This project addresses the issue by provide a virtual ANSI keyboard and convert touch events into standard DOM mouse events.

Use `npm run dev:expose` to expose the webpage to the local network.

(for example, connect your computer to your phone's hotspot and open the webpage on
your phone).

# Usage

## Virtual Keyboard

```html
<link rel="stylesheet" href="@devscholar/kbdmouse-js/dist/kbdmouse-js.css">
<script type="module">
  import "@devscholar/kbdmouse-js";
</script>
<virtual-keyboard></virtual-keyboard>
```

### Shadow DOM

By default, the virtual keyboard uses Shadow DOM to encapsulate its styles and structure. This prevents style conflicts with the rest of your page. If you need to disable Shadow DOM (for example, to debug or apply external styles), you can set the `shadow` attribute to `false`:

```html
<!-- Using Shadow DOM (default) -->
<virtual-keyboard></virtual-keyboard>

<!-- Disable Shadow DOM -->
<virtual-keyboard shadow="false"></virtual-keyboard>
```

> **Note:** When Shadow DOM is disabled, external CSS styles may affect the keyboard appearance.

# Virtual Mouse

## Notice:

The mouse polyfill controls logic resemble a **Windows Precision Touchpad**:

*   **Move / Hover:** Slide one finger on the screen.
*   **Left Click:** Single tap with one finger.
*   **Right Click:** Single tap with **two fingers**.
*   **Double Click:** Double tap with one finger.
*   **Drag (Left Button Down + Move):** Tap once, lift, then quickly tap again and hold while moving (The "Tap-and-a-Half" gesture).
*   **Scroll:** Slide with **two fingers** to send wheel events (black arrow with circle).

Note: This project will not support HTML 5 drag-and-drop events. If you want them, use [drag-drop-touch-js](https://github.com/drag-drop-touch-js/dragdroptouch) instead. 

```html
<script type="module">
    import { VkMouse } from "@devscholar/kbdmouse-js";

    document.addEventListener("DOMContentLoaded", function () {
        let element = document.getElementById("polyfilled-element");
        if (element) {
            let vkMouse = new VkMouse(element);
            
            // cancel polyfill
            // vkMouse.detach();
        } else {
            console.error("polyfilled-element element not found");
        }
    });
</script>
```

# Building

## Standard Build

```bash
npm run build
```

## Build Without Packaging (keeps module structure, no compression)

```bash
npm run build:noPackaging
```
# Quick Start
see [quick-start.md](docs/quick-start.md)

# License

MIT License
