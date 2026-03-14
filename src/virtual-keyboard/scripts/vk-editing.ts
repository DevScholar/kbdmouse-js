import type { VkKeyboard } from './vk-keyboard';

interface RangeWithModify extends Range {
    modify(alter: 'move' | 'extend', direction: 'forward' | 'backward', granularity: 'character' | 'word' | 'line' | 'lineboundary'): void;
}

export class VkEditing {
    constructor(vkKeyboard: VkKeyboard) {
        this.vkKeyboard = vkKeyboard;
    }
    vkKeyboard!: VkKeyboard;

    isEditable() {
        const activeElement = document.activeElement;
        if (!activeElement) {
            return false;
        }
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            // Check if disabled or readonly
            if (
                activeElement.getAttribute('disabled') === 'true' ||
                activeElement.getAttribute('readonly') === 'true'
            ) {
                return false;
            }
            // For INPUT element, check if type is in editable types list
            if (activeElement.tagName === 'INPUT') {
                const textLikeTypes = [
                    'text',
                    'email',
                    'number',
                    'search',
                    'tel',
                    'url',
                    'password',
                ];
                return textLikeTypes.includes((activeElement as HTMLInputElement).type || 'text');
            }
            // TEXTAREA elements are editable by default
            return true;
        } else if (activeElement.getAttribute('contenteditable') === 'true') {
            return true;
        }
        return false;
    }

    keyDown(code: string) {
        if (!this.isEditable()) {
            return;
        }

        const keyItem = this.vkKeyboard.jsonLayout.getKeyItemByCode(code);
        if (!keyItem) {
            return;
        }

        // Check if any modifier keys are pressed
        const hasModifierPressed =
            this.vkKeyboard.state.isKeyDown('ControlLeft') ||
            this.vkKeyboard.state.isKeyDown('ControlRight') ||
            this.vkKeyboard.state.isKeyDown('AltLeft') ||
            this.vkKeyboard.state.isKeyDown('AltRight') ||
            this.vkKeyboard.state.isKeyDown('MetaLeft') ||
            this.vkKeyboard.state.isKeyDown('MetaRight');

        if (this.vkKeyboard.jsonLayout.isPrintableKey(code)) {
            // Only insert text if no modifier keys are pressed
            if (!hasModifierPressed) {
                this.insertText(keyItem.key);
                this.vkKeyboard.eventDispatcher.input(code);
            }
            return;
        }

        switch (code) {
            case 'Enter':
                this.insertLineBreak();
                this.vkKeyboard.eventDispatcher.input(code);
                break;
            case 'Backspace':
                this.deleteContentBackward();
                this.vkKeyboard.eventDispatcher.input(code);
                break;
            case 'Delete':
                this.deleteContentForward();
                this.vkKeyboard.eventDispatcher.input(code);
                break;
            case 'Tab':
                // Allow Tab to insert text only if no modifiers are pressed
                if (!hasModifierPressed) {
                    this.insertText('\t');
                }
                this.vkKeyboard.eventDispatcher.input(code);
                break;
            case 'ArrowLeft':
                this.moveCursor(1, 'left');
                break;
            case 'ArrowRight':
                this.moveCursor(1, 'right');
                break;
            case 'ArrowUp':
                this.moveCursor(1, 'up');
                break;
            case 'ArrowDown':
                this.moveCursor(1, 'down');
                break;
            case 'Home':
                this.moveCursorToEdge('lineStart');
                break;
            case 'End':
                this.moveCursorToEdge('lineEnd');
                break;
            case 'PageUp':
                this.moveCursor(10, 'up');
                break;
            case 'PageDown':
                this.moveCursor(10, 'down');
                break;
        }
    }

    moveCursor(step: number, direction: 'left' | 'right' | 'up' | 'down') {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (direction === 'left') {
                const newPos = Math.max(0, selectionStart - step);
                input.setSelectionRange(newPos, newPos);
            } else if (direction === 'right') {
                const newPos = Math.min(input.value.length, selectionEnd + step);
                input.setSelectionRange(newPos, newPos);
            } else if (direction === 'up' || direction === 'down') {
                const value = input.value;
                // Find the start position of the current line and column offset
                const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
                const col = selectionStart - lineStart;
                if (direction === 'up') {
                    // Find previous line
                    const prevLineEnd = lineStart - 1;
                    if (prevLineEnd < 0) return; // Already at first line
                    const prevLineStart = value.lastIndexOf('\n', prevLineEnd - 1) + 1;
                    const newPos = prevLineStart + Math.min(col, prevLineEnd - prevLineStart);
                    input.setSelectionRange(newPos, newPos);
                } else {
                    // Find next line
                    const nextLineStart = value.indexOf('\n', selectionStart);
                    if (nextLineStart === -1) return; // Already at last line
                    const nextLineStart2 = nextLineStart + 1;
                    const nextLineEnd = value.indexOf('\n', nextLineStart2);
                    const nextLineLength =
                        nextLineEnd === -1 ? value.length - nextLineStart2 : nextLineEnd - nextLineStart2;
                    const newPos = nextLineStart2 + Math.min(col, nextLineLength);
                    input.setSelectionRange(newPos, newPos);
                }
            }
        } else if (activeElement.getAttribute('contenteditable') === 'true') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (direction === 'left' || direction === 'right') {
                    range.collapse(true);
                    (range as RangeWithModify).modify(
                        'move',
                        direction === 'left' ? 'backward' : 'forward',
                        'character'
                    );
                } else if (direction === 'up' || direction === 'down') {
                    range.collapse(true);
                    (range as RangeWithModify).modify(
                        'move',
                        direction === 'up' ? 'backward' : 'forward',
                        'line'
                    );
                }
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    moveCursorToEdge(destination: 'textBoxStart' | 'textBoxEnd' | 'lineStart' | 'lineEnd') {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (destination === 'textBoxStart') {
                input.setSelectionRange(0, 0);
            } else if (destination === 'textBoxEnd') {
                input.setSelectionRange(input.value.length, input.value.length);
            } else if (destination === 'lineStart') {
                input.setSelectionRange(
                    selectionStart -
                        (selectionStart - input.value.lastIndexOf('\n', selectionStart - 1)),
                    selectionStart -
                        (selectionStart - input.value.lastIndexOf('\n', selectionStart - 1))
                );
            } else if (destination === 'lineEnd') {
                input.setSelectionRange(
                    selectionEnd - (selectionEnd - input.value.indexOf('\n', selectionEnd)),
                    selectionEnd - (selectionEnd - input.value.indexOf('\n', selectionEnd))
                );
            }
        } else if (activeElement.getAttribute('contenteditable') === 'true') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (destination === 'textBoxStart') {
                    range.selectNodeContents(activeElement);
                    range.collapse(true);
                } else if (destination === 'textBoxEnd') {
                    range.selectNodeContents(activeElement);
                    range.collapse(false);
                } else if (destination === 'lineStart') {
                    range.collapse(true);
                    (range as RangeWithModify).modify('move', 'backward', 'lineboundary');
                } else if (destination === 'lineEnd') {
                    range.collapse(true);
                    (range as RangeWithModify).modify('move', 'forward', 'lineboundary');
                }
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    insertText(text: string) {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            input.value =
                input.value.slice(0, selectionStart) + text + input.value.slice(selectionEnd);
            input.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
        } else if (activeElement.getAttribute('contenteditable') === 'true') {
            document.execCommand('insertText', false, text);
        }
    }

    insertLineBreak() {
        this.insertText('\n');
    }

    deleteContentBackward() {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (selectionStart !== selectionEnd) {
                input.value =
                    input.value.slice(0, selectionStart) + input.value.slice(selectionEnd);
                input.setSelectionRange(selectionStart, selectionStart);
            } else if (selectionStart > 0) {
                input.value =
                    input.value.slice(0, selectionStart - 1) + input.value.slice(selectionStart);
                input.setSelectionRange(selectionStart - 1, selectionStart - 1);
            }
        } else if (activeElement.getAttribute('contenteditable') === 'true') {
            document.execCommand('delete', false, '');
        }
    }

    deleteContentForward() {
        const activeElement = document.activeElement!;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
            const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
            const selectionStart = input.selectionStart!;
            const selectionEnd = input.selectionEnd!;
            if (selectionStart !== selectionEnd) {
                input.value =
                    input.value.slice(0, selectionStart) + input.value.slice(selectionEnd);
                input.setSelectionRange(selectionStart, selectionStart);
            } else if (selectionEnd < input.value.length) {
                input.value =
                    input.value.slice(0, selectionEnd) + input.value.slice(selectionEnd + 1);
                input.setSelectionRange(selectionEnd, selectionEnd);
            }
        } else if (activeElement.getAttribute('contenteditable') === 'true') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (range.collapsed) {
                    range.deleteContents();
                } else {
                    document.execCommand('delete', false, '');
                }
            }
        }
    }
}
