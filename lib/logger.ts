/**
 * Logging utility for development and production
 * - debug: Only logs in development
 * - warn: Always logs warnings
 * - error: Always logs errors
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Warning logging - always logs
   */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /**
   * Error logging - always logs
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

