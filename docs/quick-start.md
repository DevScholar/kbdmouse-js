# Quick Start Guide

This guide will walk you through setting up **kbdmouse-js** in a new project.

---

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

---

## Step 1: Create a New Project Folder

```bash
mkdir kbdmouse-demo
cd kbdmouse-demo
npm init -y
```

---

## Step 2: Install kbdmouse-js

```bash
npm install @devscholar/kbdmouse-js
```

---

## Step 3: Create Your HTML File

Create an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>KBDMouseJS Demo</title>
  <link rel="stylesheet" href="@devscholar/kbdmouse-js/dist/kbdmouse-js.css">
</head>
<body>
  <h1>KBDMouseJS Quick Start</h1>
  <textarea id="demo-textarea" placeholder="Type here..." rows="4" style="width: 100%;"></textarea>
  <p>The virtual keyboard will appear automatically when you focus on the textarea.</p>
  
  <virtual-keyboard></virtual-keyboard>
  
  <div id="target-area">
    <p>Draw or drag here with touch (mobile)</p>
  </div>
  
  <script type="module">
    import { VkMouse } from "@devscholar/kbdmouse-js";
    
    document.addEventListener("DOMContentLoaded", function () {
      let element = document.getElementById("target-area");
      if (element) {
        let vkMouse = new VkMouse(element);
        console.log("Mouse polyfill initialized");
      }
    });
  </script>
</body>
</html>
```

---

## Step 4: Run the Project

We recommend using **Vite** as your development server:

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

---

## Step 5: Open in Browser

Navigate to **http://localhost:5173** (Vite default port).
