# Manual Testing Checklist

This document records the manual testing performed on KBDMouseJS. All tests have been completed successfully.

**Test Date:** March 2026  
**Test Environment:** Mobile devices with touch support  
**Test Status:** ✅ All Passed

---

## Virtual Keyboard Tests

### Basic Key Input

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Single letter key press | Tap any letter key (A-Z) | Correct lowercase letter is input | ✅ Pass |
| Number key press | Tap any number key (0-9) | Correct number is input | ✅ Pass |
| Symbol key press | Tap symbol keys (`, -, =, [, ], \, ;, ', ,, ., /) | Correct symbol is input | ✅ Pass |
| Space key | Tap Space key | Space character is input | ✅ Pass |
| Enter key | Tap Enter key | Line break is inserted | ✅ Pass |
| Tab key | Tap Tab key | Tab character is inserted | ✅ Pass |
| Backspace key | Tap Backspace key | Character before cursor is deleted | ✅ Pass |
| Delete key | Tap Delete key | Character after cursor is deleted | ✅ Pass |

### Modifier Keys (Shift, Ctrl, Alt, Meta)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Shift + letter | Press Shift, then tap letter key | Uppercase letter is input | ✅ Pass |
| Shift + number/symbol | Press Shift, then tap number/symbol key | Shifted symbol is input (!, @, #, etc.) | ✅ Pass |
| Shift auto-release | Press Shift, tap letter, release | Shift is automatically released after input | ✅ Pass |
| Ctrl + key combination | Press Ctrl, then tap another key | Ctrl+key event is dispatched | ✅ Pass |
| Alt + key combination | Press Alt, then tap another key | Alt+key event is dispatched | ✅ Pass |
| Meta (Win) + key | Press Meta, then tap another key | Meta+key event is dispatched | ✅ Pass |
| Multiple modifiers | Press Ctrl+Shift, then tap key | Ctrl+Shift+key event is dispatched | ✅ Pass |

### Toggle Keys (CapsLock, NumLock)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| CapsLock toggle | Tap CapsLock key | CapsLock activates, visual state changes | ✅ Pass |
| CapsLock + letter | Activate CapsLock, tap letter | Uppercase letter is input | ✅ Pass |
| CapsLock + Shift + letter | CapsLock on, Shift + letter | Lowercase letter is input (reversed) | ✅ Pass |
| CapsLock deactivate | Tap CapsLock again | CapsLock deactivates, returns to lowercase | ✅ Pass |
| NumLock toggle | Tap NumLock key | NumLock activates, visual state changes | ✅ Pass |
| NumLock + numpad number | NumLock on, tap numpad number | Number is input instead of navigation | ✅ Pass |
| NumLock off + numpad | NumLock off, tap numpad key | Navigation function (Home, End, arrows) | ✅ Pass |

### Function Keys

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| F1-F12 keys | Tap each function key | Correct F-key event is dispatched | ✅ Pass |
| Escape key | Tap Escape key | Escape event is dispatched | ✅ Pass |

### Navigation Keys

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Arrow keys | Tap each arrow key | Cursor moves in correct direction | ✅ Pass |
| Home key | Tap Home key | Cursor moves to line start | ✅ Pass |
| End key | Tap End key | Cursor moves to line end | ✅ Pass |
| PageUp key | Tap PageUp key | Page scrolls up | ✅ Pass |
| PageDown key | Tap PageDown key | Page scrolls down | ✅ Pass |

### Editing Keys

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Insert key | Tap Insert key | Insert mode toggles | ✅ Pass |
| Delete key | Tap Delete key | Character after cursor is deleted | ✅ Pass |

### Numpad Keys

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Numpad operators | Tap +, -, *, / keys | Correct operator is input | ✅ Pass |
| Numpad Enter | Tap Numpad Enter | Enter event is dispatched | ✅ Pass |
| Numpad decimal | Tap Numpad Decimal | Decimal point is input | ✅ Pass |

### Key Repeat Functionality

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Key hold repeat | Hold down a letter key | Key repeats after delay, continues at interval | ✅ Pass |
| Repeat with modifier | Hold Ctrl + letter | Ctrl+letter repeats correctly | ✅ Pass |
| Repeat cancellation | Hold key, then release | Repeat stops immediately on release | ✅ Pass |

### Visual Feedback

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Key down visual | Press and hold any key | Key shows pressed state (highlighted) | ✅ Pass |
| Key up visual | Release key | Key returns to normal state | ✅ Pass |
| Shift state visual | Press Shift | Shift-able keys show shifted labels | ✅ Pass |
| CapsLock state visual | Activate CapsLock | Letter keys show uppercase | ✅ Pass |
| NumLock state visual | Activate NumLock | Numpad keys show numbers instead of navigation | ✅ Pass |

### Event Dispatch

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| keydown event | Press any key | keydown event is dispatched with correct properties | ✅ Pass |
| keyup event | Release key | keyup event is dispatched with correct properties | ✅ Pass |
| keypress event | Press printable key | keypress event is dispatched | ✅ Pass |
| input event | Input character | input event is dispatched for editable elements | ✅ Pass |
| Event properties | Check event details | key, code, keyCode, location are correct | ✅ Pass |
| Modifier states | Check modifier properties | shiftKey, ctrlKey, altKey, metaKey are correct | ✅ Pass |

### Auto-Resize

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Container resize | Resize keyboard container | Keyboard scales to fit container | ✅ Pass |
| Responsive scaling | Change viewport size | Keyboard adjusts scale appropriately | ✅ Pass |

---

## Mouse Polyfill Tests

### Single Finger Gestures

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Mouse move | Slide one finger on screen | mousemove event is dispatched | ✅ Pass |
| Hover simulation | Move finger without tapping | Continuous mousemove events | ✅ Pass |
| Left click | Single tap with one finger | mousedown → mouseup → click events dispatched | ✅ Pass |
| Double click | Double tap with one finger | Two click events + dblclick event dispatched | ✅ Pass |

### Two Finger Gestures

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Right click | Single tap with two fingers | contextmenu event is dispatched | ✅ Pass |
| Scroll/Wheel | Slide with two fingers | wheel event is dispatched with correct deltaX/Y | ✅ Pass |
| Scroll direction | Scroll up/down/left/right | Wheel delta matches scroll direction | ✅ Pass |

### Drag Gesture (Tap-and-a-Half)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Drag start | Tap once, lift, quickly tap and hold | mousedown event dispatched | ✅ Pass |
| Drag move | Continue holding and moving | mousemove events with button down state | ✅ Pass |
| Drag end | Release finger | mouseup and click events dispatched | ✅ Pass |
| Drag without move | Tap-and-a-half without moving | Double click is dispatched | ✅ Pass |

### Event Properties

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Client coordinates | Check event.clientX/Y | Coordinates match touch position | ✅ Pass |
| Screen coordinates | Check event.screenX/Y | Coordinates match touch position | ✅ Pass |
| Button property | Check mouse button | Correct button value (0=left, 2=right) | ✅ Pass |
| Buttons property | Check buttons state | Correct buttons bitmask | ✅ Pass |
| Bubbles/cancelable | Check event properties | Events bubble and are cancelable | ✅ Pass |

### Target Detection

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Element targeting | Tap on different elements | Events dispatched on correct target | ✅ Pass |
| Nested elements | Tap on nested element | Events bubble through ancestors | ✅ Pass |
| Outside element | Touch outside polyfilled area | No events dispatched | ✅ Pass |

### Edge Cases

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Three+ fingers | Touch with 3+ fingers | Gesture is ignored | ✅ Pass |
| Rapid taps | Tap rapidly multiple times | Each tap produces correct events | ✅ Pass |
| Touch cancel | Trigger touch cancel | Touch end is handled correctly | ✅ Pass |
| Move threshold | Move slightly before tap | Small movements ignored, tap still works | ✅ Pass |

### Cleanup

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Detach polyfill | Call vkMouse.detach() | All event listeners are removed | ✅ Pass |
| Re-initialize | Create new VkMouse after detach | Polyfill works correctly | ✅ Pass |

---

## Integration Tests

### Virtual Keyboard + Mouse Polyfill

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Combined usage | Use both keyboard and mouse | Both work without interference | ✅ Pass |
| Focus handling | Use keyboard while mouse active | Focus is managed correctly | ✅ Pass |

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome Mobile | Latest | ✅ Pass |
| Safari iOS | Latest | ✅ Pass |
| Firefox Mobile | Latest | ✅ Pass |
| Samsung Internet | Latest | ✅ Pass |

### Device Compatibility

| Device Type | Status |
|-------------|--------|
| Android Phone | ✅ Pass |
| Android Tablet | ✅ Pass |
| iPhone | ✅ Pass |
| iPad | ✅ Pass |

---

## Editable Element Support

### Input Types

| Input Type | Status |
|------------|--------|
| text | ✅ Pass |
| email | ✅ Pass |
| password | ✅ Pass |
| number | ✅ Pass |
| search | ✅ Pass |
| tel | ✅ Pass |
| url | ✅ Pass |

### Other Editable Elements

| Element Type | Status |
|--------------|--------|
| textarea | ✅ Pass |
| contenteditable | ✅ Pass |

### Non-Editable States

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Disabled input | Focus disabled input, press keys | No input is inserted | ✅ Pass |
| Readonly input | Focus readonly input, press keys | No input is inserted | ✅ Pass |
| Non-editable element | Focus non-editable element, press keys | Events dispatched but no input | ✅ Pass |

---

## Summary

- **Total Test Cases:** 100+
- **Passed:** ✅ All
- **Failed:** None

All manual tests have been completed successfully. The library is functioning as expected across all tested devices and browsers.
