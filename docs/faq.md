# Frequently Asked Questions

## What Scenarios is This Project Not Suitable For?

First, this project is still in the Pre-Alpha stage, so you should not use it in production environments. It is designed for retro computing purposes, meaning it only includes the most basic text box editing support, as that is not the primary focus. The main goal of this project is to accurately simulate standard PC keyboard events for use in web-based emulators. Furthermore, this project currently does not support multilingual keyboard layouts; it only supports the ANSI keyboard layout, typically used for US English. If you are looking for a virtual keyboard for commercial products (such as embedded devices), you should use [simple-keyboard](https://github.com/hodgef/simple-keyboard), which is an industry-certified solution.

Regarding drag-and-drop support, this project's drag-and-drop focuses more on retro computing, that is, compatibility with old web pages and professional emulators. It aims to accurately implement DOM mouse events rather than provide a comprehensive mobile HTML 5 drag-and-drop solution. This project will not support HTML5 drag-and-drop events. If you want them, use [DragDropTouch](https://github.com/drag-drop-touch-js/dragdroptouch) instead.

## What Scenarios is This Project Suitable For?

This project is specifically designed for retro computing, emphasizing compatibility with emulators and old web pages. For example, running an emulator in a web page (like running a Windows 95 virtual machine in a browser) or providing mobile compatibility for legacy web pages that only consider mouse events for dragging (such as a webpage that implements DHTML window dragging effects using mouse events).

## How Does This Project Work?

For the keyboard, this project provides a virtual PC keyboard based on DOM elements. It uses the standard ANSI keyboard layout, supports keys not available in mobile input methods like Ctrl+Alt+Delete and arrow keys, and supports common keyboard events like keyup and keydown. For the mouse, this project converts mobile touch events into mouse events based on specific rules.

## Why Does the Emulator Behave Strangely or Not Work at All When Used with This Project?

If an emulator behaves strangely or erratically—such as double key presses or the mouse requiring movement to release after pressing—it may be due to poor built-in mobile support in the emulator conflicting with this project. Please refer to the emulator’s documentation or contact its developer to see if the emulator’s built-in mobile support can be disabled. If this project has no effect on the emulator at all, it may be because the emulator does not use standard DOM input events.

Generally, emulators have specialized APIs for inputting keyboard and mouse events. To fix the behavior of these emulators, you can provide the emulator’s documentation and this project’s source code to an AI and request it to generate a customized version of this project (typically, only a customized version of the event dispatcher class is needed).