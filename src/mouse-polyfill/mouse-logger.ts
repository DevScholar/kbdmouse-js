/**
 * Logger Module
 * Provides configurable logging functionality with decorator pattern support
 */

export interface LoggerConfig {
  enabled: boolean;
  logFunction?: (message: string) => void;
}

export class MouseLogger {
  private _enabled: boolean = false;
  private _currentLoggingElement: HTMLElement | null = null;
  private _loggerFunction: (message: string) => void;
  private _isRunning: boolean = false;
  private _eventTypeFilter: string = '';

  constructor(config: LoggerConfig = { enabled: false }) {
    this._enabled = config.enabled;
    this._loggerFunction = config.logFunction || this.defaultLoggerFunction;
  }

  /**
   * Getter for current logging element
   */
  get currentLoggingElement(): HTMLElement | null {
    return this._currentLoggingElement;
  }

  /**
   * Setter for current logging element
   */
  set currentLoggingElement(element: HTMLElement | null) {
    this._currentLoggingElement = element;
  }

  /**
   * Default logger function - writes to console
   */
  private defaultLoggerFunction(message: string): void {
    console.log(message);
  }

  /**
   * Main logging function
   */
  log(message: string): void {
    if (this._enabled) {
      // If event type filter is set, check if this message should be logged
      if (this._eventTypeFilter) {
        // Check if message contains event information (basic pattern matching)
        const eventMatch = message.match(/event=(\w+)/);
        if (eventMatch) {
          const messageEventType = eventMatch[1];
          const allowedEventTypes = this._eventTypeFilter.split(',').map(type => type.trim());
          if (!allowedEventTypes.includes(messageEventType)) {
            return; // Skip logging this message
          }
        }
      }
      this._loggerFunction(message);
    }
  }

  /**
   * Format timestamp as [HH:mm:ss.SSS]
   */
  formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `[${hours}:${minutes}:${seconds}.${milliseconds}]`;
  }

  /**
   * Log mouse/touch event in specified format
   */
  logMouseEvent(
    eventType: string, 
    x: number, 
    y: number, 
    button?: number, 
    buttons?: number, 
    source: 'physical' | 'virtual' = 'virtual', 
    pointerType?: string, 
    pointerId?: number
  ): void {
    // Check if event type filter is set and if this event type should be logged
    if (this._eventTypeFilter) {
      const allowedEventTypes = this._eventTypeFilter.split(',').map(type => type.trim());
      if (!allowedEventTypes.includes(eventType)) {
        return; // Skip logging this event type
      }
    }
    
    const timestamp = this.formatTimestamp();
    let logMessage = `${timestamp}event=${eventType},x=${x},y=${y}`;
    
    // Add button and buttons for mouse events
    if (button !== undefined) {
      logMessage += `,button=${button}`;
    }
    if (buttons !== undefined) {
      logMessage += `,buttons=${buttons}`;
    }
    
    // Add pointer-specific information
    if (pointerType !== undefined) {
      logMessage += `,pointerType=${pointerType}`;
    }
    if (pointerId !== undefined) {
      logMessage += `,pointerId=${pointerId}`;
    }
    
    logMessage += `,source=${source}`;
    this.log(logMessage);
  }

  /**
   * Start logging
   */
  start(): void {
    this._isRunning = true;
    this.log('[Logger] Started logging');
  }

  /**
   * Stop logging
   */
  stop(): void {
    this._isRunning = false;
    this.log('[Logger] Stopped logging');
  }

  /**
   * Check if logger is running
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Get event type filter (comma-separated event type names)
   */
  get eventTypeFilter(): string {
    return this._eventTypeFilter;
  }

  /**
   * Set event type filter (comma-separated event type names)
   */
  set eventTypeFilter(filter: string) {
    this._eventTypeFilter = filter;
  }

  /**
   * Check if logger is enabled
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Enable/disable logging
   */
  set enabled(value: boolean) {
    this._enabled = value;
  }

  /**
   * Get current logger function
   */
  get loggerFunction(): (message: string) => void {
    return this._loggerFunction;
  }

  /**
   * Set logger function (decorator pattern)
   * This allows customizing where logs are written
   */
  set loggerFunction(fn: (message: string) => void) {
    this._loggerFunction = fn;
    // Keep enabled when setting custom function
    this._enabled = true;
  }

  /**
   * Set custom log function (alternative method)
   */
  setLogFunction(fn: (message: string) => void): void {
    this.loggerFunction = fn;
  }
}

/**
 * Global logger instance
 */
export const globalLogger = new MouseLogger();