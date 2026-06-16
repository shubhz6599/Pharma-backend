// src/utils/logger.ts
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<LogLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
};
const reset = '\x1b[0m';

export const logger = {
  info: (msg: string, ...args: unknown[]) => console.log(`${colors.info}[INFO]${reset}`, msg, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`${colors.warn}[WARN]${reset}`, msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`${colors.error}[ERROR]${reset}`, msg, ...args),
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.debug}[DEBUG]${reset}`, msg, ...args);
    }
  },
};


// src/utils/ApiError.ts
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string) { return new ApiError(400, msg); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new ApiError(403, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg: string) { return new ApiError(409, msg); }
  static internal(msg = 'Internal server error') { return new ApiError(500, msg, false); }
}