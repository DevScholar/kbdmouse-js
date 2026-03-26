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

The virtual keyboard is a [Custom Element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements). Drop it into your HTML and it manages its own lifecycle automatically — no JavaScript required.

```html
<link rel="stylesheet" href="@devscholar/kbdmouse-js/dist/kbdmouse-js.css">
<script type="module">
  import "@devscholar/kbdmouse-js";
</script>
<virtual-keyboard></virtual-keyboard>
```

### Attributes

| Attribute | Value | Default | Description |
|-----------|-------|---------|-------------|
| `shadow`  | `"false"` | (enabled) | Disable Shadow DOM encapsulation. Useful for debugging or applying external styles. |

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

The mouse polyfill is a JavaScript class. Unlike the keyboard, the polyfill target element is chosen at runtime via JavaScript, so it cannot be configured with HTML alone.

## Notice:

The mouse polyfill controls logic resemble a **Windows Precision Touchpad**:

*   **Move / Hover:** Slide one finger on the screen.
*   **Left Click:** Single tap with one finger.
*   **Right Click:** Single tap with **two fingers**.
*   **Double Click:** Double tap with one finger.
*   **Drag (Left Button Down + Move):** Tap once, lift, then quickly tap again and hold while moving (The "Tap-and-a-Half" gesture).
*   **Wheel:** Slide with **two fingers** to send wheel events (black arrow with circle).

Note: This project will not support HTML 5 drag-and-drop events. If you want them, use [drag-drop-touch-js](https://github.com/drag-drop-touch-js/dragdroptouch) instead.

```html
<script type="module">
    import { VkMouse } from "@devscholar/kbdmouse-js";

    document.addEventListener("DOMContentLoaded", function () {
        let element = document.getElementById("polyfilled-element");
        if (element) {
            let vkMouse = new VkMouse(element);

            // Pause and resume the polyfill
            // vkMouse.pause();
            // vkMouse.resume();

            // Permanently destroy the instance and clean up all event listeners
            // vkMouse.destroy();
        } else {
            console.error("polyfilled-element element not found");
        }
    });
</script>
```

### Methods

| Method | Description |
|--------|-------------|
| `pause()` | Temporarily suspend the polyfill. Touch events are no longer converted. |
| `resume()` | Resume a suspended polyfill. |
| `destroy()` | Permanently remove all event listeners. The instance cannot be reused. |
| `detach()` | Remove all touch event listeners from the element. Like `pause()`, but expresses intent to fully uninstall the polyfill. Call `attach()` to reinstall. |
| `attach()` | Reinstall the polyfill after `detach()`. |

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
