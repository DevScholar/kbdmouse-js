# kbdmouse-js

**PC Input Event Emulator for Legacy Web Compatibility**

⚠️ **Pre-Alpha Warning**: This project is in Pre-Alpha stage and may undergo significant API changes. Not recommended for production use.

⚠️ **Specialized Tool**: This is NOT a general-purpose virtual keyboard library. It's specifically designed for emulator applications and legacy web compatibility scenarios.

## Purpose

This project provides **hardware-accurate keyboard emulation** for:

- **Emulator Applications**: Accurate PC hardware keyboard behavior emulation

- **Hardware Simulation**: Recreate traditional PC input experiences with exact hardware behavior

## Core Features

### ⌨️ Hardware Keyboard Emulation
- **Full 104-key QWERTY layout** with accurate hardware behavior
- **Full NumLock support** - numpad navigation when disabled, numbers when enabled
- **Accurate cursor control** - Home/End, Page Up/Down, arrow key behavior
- **Modifier key accuracy** - proper Shift/CapsLock/NumLock interactions
- **Hardware-accurate key events** - accurate key codes and event sequences



### 📝 Event Debugging
- **Physical/virtual keyboard synchronization** 
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

The project builds ES modules exclusively:

- **TypeScript Config**: `tsconfig.json` with `"module": "ES2022"`
- **Output Format**: Pure ES modules in `dist/` directory
- **Source Maps**: Generated for debugging (`.js.map` files)
- **No UMD/CommonJS**: Modern ES module format only

### Output Structure

After building, the `dist/` directory will contain:
```
dist/
├── virtual-key.js              # Virtual key component
├── virtual-keyboard.js         # Keyboard behavior emulation
├── prefab-virtual-keyboard.js  # Ready-to-use emulator keyboard
├── mouse-polyfill.js           # Mouse event polyfill
└── *.js.map                    # Source map files
```

## Usage

### HTML Usage

#### Keyboard Emulator
Suitable for PC emulators requiring accurate hardware keyboard behavior:

```javascript
// Import the prefab virtual keyboard
import { PrefabVirtualKeyboard } from './dist/prefab-virtual-keyboard.js';
```

```html
<!-- Text input that will work with virtual keyboard -->
<textarea id="text-input" placeholder="Click here to use virtual keyboard"></textarea>

<!-- Hardware-accurate keyboard for PC emulators -->
<prefab-virtual-keyboard
  id="emulator-keyboard"
  keyboard-css-src="./qwerty-104-key-keyboard.css" 
  keyboard-html-src="./qwerty-104-key-keyboard.html"
  virtual-key-script-src="./virtual-key.js"
  virtual-keyboard-script-src="./virtual-keyboard.js"
>
</prefab-virtual-keyboard>
```

#### Mouse Demo
```javascript
// Import mouse polyfill for touch devices
import { MousePolyfill } from './mouse-polyfill.js';
 
 // Create instance
 const mousePolyfill = new MousePolyfill();
 
 // Enable polyfill for specific element
 mousePolyfill.addPolyfillFor(document.getElementById('demo-area'));
 mousePolyfill.debug = true; // Enable debug mode
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



## Important Notes

⚠️ **Specialized Compatibility Tool**: This project is specifically designed for emulator and legacy compatibility scenarios, NOT general virtual keyboard applications.

### Technical Focus
- **Hardware Accuracy**: Accurate PC keyboard behavior replication, not modern UX
- **Event Fidelity**: Accurate keyboard event emulation for compatibility
- **Legacy Orientation**: Optimized for recreating traditional PC input experiences
- **Debugging Support**: Comprehensive input event inspection for development

### Use Cases
✅ **Emulator Development**: PC hardware simulation requiring exact keyboard behavior
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
├── mouse-polyfill.ts           # Mouse event polyfill for legacy browsers
├── qwerty-104-key-keyboard.*   # 104-key hardware layout files
├── main.ts                     # Entry point
└── typescript.svg              # TypeScript logo
```

## Browser Support

- **Requirements**: ES modules (`type="module"`), Custom Elements

```html
<!-- Use type="module" for all imports -->
<script type="module">
  import './dist/virtual-keyboard.js';
</script>
```

## License

MIT License - See LICENSE file for details

