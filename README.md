# KBDMouseJS

⚠️ This project is still in pre-alpha stage, and API is subject to change.

## Introduction

This project is a polyfill that provides mouse and keyboard events for mobile devices (such as phones) to address the issue of these events not being supported on mobile. For example, an x86 emulator running in a web page may require keyboard and mouse events to function. Similarly, some old web pages' drag-and-drop features might not have taken mobile touch events into account. This project addresses the issue by converting touch events into standard DOM mouse events.


## Usage

### Virtual Keyboard
```html

<!-- Include the library and stylesheet in dist folder, then -->
<virtual-keyboard></virtual-keyboard>
<!-- That's all.-->
```
### Virtual Mouse
```html

<!-- Include the library and stylesheet in dist folder, then -->
<script>
    let vkMouse = document.querySelector("polyfilled-element");
</script>
<!-- That's all.-->
```

## License

MIT License
