# KBDMouseJS

⚠️ This project is still in pre-alpha stage, and API is subject to change.

## Introduction

This project is a polyfill that provides mouse and keyboard events for mobile devices (such as phones) to address the issue of these events not being supported on mobile. For example, an x86 emulator running in a web page may require keyboard and mouse events to function. Similarly, some old web pages' drag-and-drop features might not have taken mobile touch events into account. This project addresses the issue by converting touch events into standard DOM mouse events.


## Usage

### Virtual Keyboard
```html
<link rel="stylesheet" href="src/virtual-keyboard/styles/vk-keyboard.css">
<script type="module" src="src/virtual-keyboard/scripts/vk-keyboard.ts"></script>
<virtual-keyboard></virtual-keyboard>
```
### Virtual Mouse
```html
<script type="module" src="src/mouse-polyfill/scripts/vk-mouse.ts"></script>
<script type="module">
    import { VkMouse } from './src/mouse-polyfill/scripts/vk-mouse.ts';

    document.addEventListener('DOMContentLoaded', function () {
      let element = document.getElementById('polyfilled-element');
      if (element) {
        let vkMouse = new VkMouse(element);
      } else {
        console.error('polyfilled-element element not found');
      }
    });
</script>
```

## License

MIT License
