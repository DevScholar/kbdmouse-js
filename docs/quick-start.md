# Quick Start Guide

This guide will walk you through setting up **kbdmouse-js** in a new project, from creating the project folder to running it in your browser.

kbdmouse-js provides a virtual keyboard and mouse polyfill for mobile devices, enabling keyboard and mouse events on touch-based devices. This is useful for retro computing projects, x86 emulators (like DOSBox or Windows 95), and legacy web applications that rely on mouse and keyboard events.

---

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

---

## Step 1: Create a New Project Folder

Open your terminal and create a new directory for your project:

```bash
mkdir kbdmouse-demo
cd kbdmouse-demo
```

Initialize a new npm project:

```bash
npm init -y
```

---

## Step 2: Install kbdmouse-js

Install the package from npm:

```bash
npm install @devscholar/kbdmouse-js
```

This will download the package and save it to your `node_modules` folder.

---

## Step 3: Create Your HTML File

Create an `index.html` file in your project folder with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>KBDMouseJS Demo</title>
  
  <!-- Virtual Keyboard Styles -->
  <link rel="stylesheet" href="./node_modules/@devscholar/kbdmouse-js/src/virtual-keyboard/styles/vk-keyboard.css">
  
  <style>
    body {
      font-family: sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    #target-area {
      width: 100%;
      height: 300px;
      border: 2px solid #ccc;
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9f9f9;
    }
  </style>
</head>
<body>
  <h1>KBDMouseJS Quick Start</h1>
  
  <p>Type in the textarea below using the virtual keyboard:</p>
  <textarea id="demo-textarea" placeholder="Type here..." rows="4" style="width: 100%;"></textarea>
  
  <p>The virtual keyboard will appear automatically when you focus on the textarea.</p>
  
  <!-- Virtual Keyboard Component -->
  <virtual-keyboard></virtual-keyboard>
  
  <!-- Mouse Polyfill Script -->
  <script type="module" src="./node_modules/@devscholar/kbdmouse-js/src/mouse-polyfill/scripts/vk-mouse.ts"></script>
  
  <!-- Virtual Keyboard Script -->
  <script type="module" src="./node_modules/@devscholar/kbdmouse-js/src/virtual-keyboard/scripts/vk-keyboard.ts"></script>
  
  <!-- Initialize Mouse Polyfill -->
  <script type="module">
    import { VkMouse } from "./node_modules/@devscholar/kbdmouse-js/src/mouse-polyfill/scripts/vk-mouse.ts";
    
    document.addEventListener("DOMContentLoaded", function () {
      let element = document.getElementById("target-area");
      if (element) {
        let vkMouse = new VkMouse(element);
        console.log("Mouse polyfill initialized on target-area");
      }
    });
  </script>
  
  <div id="target-area">
    <p>Draw or drag here with touch (mobile)</p>
  </div>
  
</body>
</html>
```

---

## Step 4: Run the Project

We recommend using **Vite** as your development server. It's fast, handles TypeScript natively, and supports hot module replacement.

First, install Vite as a development dependency:

```bash
npm install -D vite
```

Add a start script to your `package.json`:

```json
{
  "scripts": {
    "start": "vite"
  }
}
```

Then start the development server:

```bash
npm run start
```

Vite will start a local server (usually at **http://localhost:5173**).

---

## Step 5: Open in Browser

Once your server is running, open your browser and navigate to:

- **http://localhost:8080** (Python/http-server)
- **http://localhost:5173** (Vite, default port)

### Testing on Mobile

To test on a mobile device connected to the same network:

1. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` in Command Prompt
   - **macOS**: Run `ifconfig` in Terminal
   - **Linux**: Run `ip addr` in Terminal

2. Make sure your firewall allows incoming connections on the port you're using.

3. On your mobile device, open a browser and navigate to:
   - `http://YOUR_IP_ADDRESS:PORT`
   
   For example: `http://192.168.1.100:8080`

---

## Usage Instructions

### Virtual Keyboard

The virtual keyboard appears automatically when you focus on a text input (like `<input>` or `<textarea>`). It provides a full ANSI keyboard layout that works with touch events.

### Mouse Polyfill

The mouse polyfill simulates mouse events using touch gestures, similar to a **Windows Precision Touchpad**:

| Gesture | Action |
|---------|--------|
| Single finger slide | Move / Hover |
| Single tap | Left Click |
| Two-finger tap | Right Click |
| Double tap (one finger) | Double Click |
| Tap, lift, then tap and hold + slide | Drag |
| Two-finger slide | Scroll (wheel event) |

---

## Troubleshooting

### Virtual Keyboard Not Appearing

Make sure:
1. The CSS file is correctly linked
2. The `<virtual-keyboard></virtual-keyboard>` element is present in your HTML
3. The keyboard script is loaded as a module (`type="module"`)

### Mouse Events Not Working

Make sure:
1. The target element has an ID and is passed to `VkMouse` constructor
2. Touch events are not being handled by other scripts
3. Check browser console for error messages

### Mobile Network Access Issues

- Ensure your mobile device is connected to the same Wi-Fi network as your computer
- Try disabling your firewall temporarily to test
- Use the correct local IP address (not `localhost` or `127.0.0.1`)

---

## Next Steps

- Explore the **examples** folder in the package for more complex use cases
- Check the [FAQ](faq.md) for common questions
- Review the main [README](../README.md) for detailed API documentation
