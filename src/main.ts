import './virtual-keyboard.js';
import './virtual-key.js';
import './prefab-virtual-keyboard.js';



// Add some convenient global functions
declare global {
  interface Window {
    log: (message: string, type?: string) => void;
  }
}

// Listen for page load completion
document.addEventListener('DOMContentLoaded', () => {
  // Test keyboard event listeners
  document.addEventListener('keydown', (e) => {
    const source = (e as any)._polyFilldataset?.source || 'physical';
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Meta');
    
    let extraInfo = '';
    if (e.repeat) extraInfo += ' (repeat)';
    if (e.isComposing) extraInfo += ' (composing)';
    if (e.location && e.location !== 0) {
      const locationNames = ['', 'Left', 'Right', 'Numpad'];
      extraInfo += ` (${locationNames[e.location] || 'Unknown'})`;
    }
    
    const modifierStr = modifiers.length > 0 ? ` [${modifiers.join('+')}]` : '';
  });
  
  document.addEventListener('keyup', (e) => {
    const source = (e as any)._polyFilldataset?.source || 'physical';
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Meta');
    
    let extraInfo = '';
    if (e.isComposing) extraInfo += ' (composing)';
    if (e.location && e.location !== 0) {
      const locationNames = ['', 'Left', 'Right', 'Numpad'];
      extraInfo += ` (${locationNames[e.location] || 'Unknown'})`;
    }
    
    const modifierStr = modifiers.length > 0 ? ` [${modifiers.join('+')}]` : '';
  });
});

// Export main classes for external use
export { VirtualKeyboard } from './virtual-keyboard.js';
export { VirtualKey } from './virtual-key.js';
export { PrefabVirtualKeyboard } from './prefab-virtual-keyboard.js';
