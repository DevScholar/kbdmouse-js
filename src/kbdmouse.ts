// Main entry file - Export all primary functionality of the library

// Import CSS styles
import './virtual-keyboard/styles/vk-keyboard.css'

// Virtual keyboard related exports
export { VkKeyboard } from './virtual-keyboard/scripts/vk-keyboard.js'
export { VkState } from './virtual-keyboard/scripts/vk-state.js'
export { VkEventDispatcher } from './virtual-keyboard/scripts/vk-event-dispatcher.js'
export { VkUserOperation } from './virtual-keyboard/scripts/vk-user-operation.js'
export { VkVisual } from './virtual-keyboard/scripts/vk-visual.js'
export { VkTemplate } from './virtual-keyboard/scripts/vk-template.js'
export { VkEditing } from './virtual-keyboard/scripts/vk-editing.js'
export { VkJsonLayout } from './virtual-keyboard/scripts/vk-json-layout.js'
export { VkLogger } from './virtual-keyboard/scripts/vk-logger.js'
export { VkAutoResize } from './virtual-keyboard/scripts/vk-auto-resize.js'

// Mouse polyfill related exports
export { VkMouse } from './mouse-polyfill/scripts/vk-mouse.js'
export { VkMouseEventDispatcher } from './mouse-polyfill/scripts/vk-mouse-event-dispatcher.js'
export { VkMouseUserOperation } from './mouse-polyfill/scripts/vk-mouse-user-operation.js'
export { VkMouseState } from './mouse-polyfill/scripts/vk-mouse-state.js'