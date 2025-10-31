# kbdmouse-js

**PC Input Event Emulator for Legacy Web Compatibility**

⚠️ **Pre-Alpha Warning**: This project is in Pre-Alpha stage and may undergo significant API changes. Not recommended for production use.

⚠️ **Specialized Tool**: This is NOT a general-purpose virtual keyboard library. It's specifically designed for emulator applications and legacy web compatibility scenarios.

## Purpose

This project provides **hardware-accurate keyboard emulation** for:

- **Emulator Applications**: Accurate PC hardware keyboard behavior emulation

- **Hardware Emulation**: Recreate traditional PC input experiences with exact hardware behavior

## Core Features

### ⌨️ Hardware Keyboard Emulation
- **Full 104-key QWERTY layout** with accurate hardware behavior
- **Full NumLock support** - numpad navigation when disabled, numbers when enabled
- **Accurate cursor control** - Home/End, Page Up/Down, arrow key behavior
- **Modifier key accuracy** - proper Shift/CapsLock/NumLock interactions
- **Hardware-accurate key events** - accurate key codes and event sequences



### 📝 Event Debugging
- **Detailed key state tracking** and event sequence debugging

### 🖱️ Mouse Support
- **Hardware-accurate mouse emulation** for complete input device emulation
- **Mouse event polyfill** for legacy browser compatibility
- **Precise cursor positioning** and movement tracking
- **Button state emulation** - accurate left/right/middle click behavior
- **Mouse event debugging** - real-time mouse event logging and analysis


## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build
```

### Build Configuration

The project builds modern ES modules:

- **TypeScript Config**: `tsconfig.json` with `"module": "ESNext"`
- **Output Format**: ES modules (`.mjs`) and CommonJS (`.js`) in `dist/` directory
- **Source Maps**: Generated for debugging (`.js.map` files)
- **Modern Syntax**: Target ES2022 for modern browser compatibility

### Output Structure

After building, the `dist/` directory will contain:
```
dist/
├── kbdmouse-js.mjs             # Main ES module entry point
├── kbdmouse-js.js              # CommonJS entry point
├── layouts/qwerty/qwerty.css # Keyboard layout styles
├── layouts/qwerty/qwerty.html  # Keyboard layout HTML
└── *.js.map                    # Source map files
```

## Usage

### HTML Usage

#### Keyboard Emulator
Suitable for PC emulators requiring accurate hardware keyboard behavior:

```javascript
// Import the prefab virtual keyboard (ES module)
import { PrefabVirtualKeyboard } from './dist/kbdmouse-js.mjs';

// The custom element is automatically registered when the module is imported
// You can now use <prefab-virtual-keyboard> in your HTML
```

```html
<!-- Text input that will work with virtual keyboard -->
<textarea id="text-input" placeholder="Click here to use virtual keyboard"></textarea>

<!-- Hardware-accurate keyboard for PC emulators -->
<prefab-virtual-keyboard
  id="emulator-keyboard"
  layout-css-src="/layouts/qwerty/qwerty.css" 
  layout-html-src="/layouts/qwerty/qwerty.html"
>
</prefab-virtual-keyboard>
```

#### Mouse Demo
```javascript
// Import mouse polyfill for touch devices (ES module)
import { MousePolyfill } from './dist/kbdmouse-js.mjs';

// Create instance - automatically detects touch devices
const mousePolyfill = new MousePolyfill();

// Enable polyfill for specific element
mousePolyfill.addPolyfillFor(document.getElementById('demo-area'));

// Optional: Enable debug logging
mousePolyfill.debug.setLogFunction((message) => console.log('[Mouse]', message));
```

```html
<!-- Mouse event demonstration -->
<div id="demo-area" class="demo-area">
  <div class="draggable">Drag me!</div>
  <p>Move mouse or touch here to test events</p>
</div>
```

**Mouse Event Features:**
- **Event Debugging**: Comprehensive mouse event logging for development
- **Hardware Emulation**: Accurate mouse behavior for emulator applications

### Touch Gesture Controls

The system supports intelligent touch gestures that translate to mouse events:

- **Normal Mouse Movement**: When finger stays in place for 400ms or less before moving (with a movement threshold of 10 pixels), it is treated as normal mouse movement without pressing any mouse buttons
- **Left Button Drag Mode**: When finger stays in place for more than 400ms but not more than 800ms before moving, it is treated as left button drag mode. Releasing finger triggers left mouse button release
- **Right Click**: When finger stays in place for more than 800ms without moving, it is treated as a right mouse button click

**Note**: All modules are exported through the main entry point. Import specific classes from `kbdmouse-js.mjs` rather than individual module files.



## Important Notes

⚠️ **Specialized Compatibility Tool**: This project is specifically designed for emulator and legacy compatibility scenarios, NOT general virtual keyboard applications.

### Technical Focus
- **Hardware Accuracy**: Accurate PC keyboard behavior replication, not modern UX
- **Event Fidelity**: Accurate keyboard event emulation for compatibility
- **Legacy Orientation**: Optimized for recreating traditional PC input experiences
- **Debugging Support**: Comprehensive input event inspection for development

### Use Cases
✅ **Emulator Development**: PC hardware emulation requiring exact keyboard behavior
✅ **Hardware Emulation**: Recreating traditional PC input experiences with good accuracy

❌ **Not Suitable For**:
- Modern virtual keyboards (chat apps, accessibility tools)
- Multi-language or customizable layouts
- General web development or gesture libraries

## Project Structure

```
src/
├── keyboard-demo.html          # Hardware keyboard demo
├── mouse-demo.html             # Mouse event demonstration
├── virtual-key.ts              # Virtual key component
├── virtual-keyboard.ts         # Keyboard behavior emulation
├── prefab-virtual-keyboard.ts  # Ready-to-use emulator keyboard
├── mouse-polyfill.ts           # Mouse event polyfill for touch devices
├── main.ts                     # Main entry point - exports all modules
└── typescript.svg              # TypeScript logo

public/
├── layouts/
│   └── qwerty/
│       ├── qwerty.css          # QWERTY layout styles
│       └── qwerty.html       # QWERTY layout HTML
└── vite.svg                    # Vite logo
```

## Browser Support

- **Requirements**: ES modules (`type="module"`), Custom Elements, ES2022 syntax
- **Module Loading**: Use `type="module"` in script tags for ES module imports
- **Modern Browsers**: Designed for modern browsers with ES2022+ support


## License

MIT License - See LICENSE file for details

