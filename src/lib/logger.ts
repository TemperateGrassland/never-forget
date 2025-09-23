import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import winston from 'winston';

// Initialize Logtail only if token is provided (optional for local development)
const logtailToken = process.env.LOGTAIL_TOKEN;
const logtailEndpoint = process.env.LOGTAIL_ENDPOINT;

const logtail = logtailToken ? new Logtail(logtailToken, {
  endpoint: logtailEndpoint || 'https://in.logs.betterstack.com'
}) : null;


// Custom format for consistent logging
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports: winston.transport[] = [
  // Always log to console for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add Logtail transport if token is available
if (logtail) {
  transports.push(new LogtailTransport(logtail));
}

// Create the winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false
});

// Define a type for log metadata
type LogMetadata = Record<string, unknown>;

// Helper functions for common log levels
export const log = {
  error: (message: string, meta?: LogMetadata) => logger.error(message, meta),
  warn: (message: string, meta?: LogMetadata) => logger.warn(message, meta),
  info: (message: string, meta?: LogMetadata) => logger.info(message, meta),
  debug: (message: string, meta?: LogMetadata) => logger.debug(message, meta),
  
  // Specialized helpers for common use cases
  apiRequest: (method: string, path: string, userId?: string, meta?: LogMetadata) => {
    logger.info(`API Request - ${path}`, { 
      method, 
      path, 
      userId, 
      timestamp: new Date().toISOString(),
      ...meta 
    });
  },
  
  apiResponse: (method: string, path: string, statusCode: number, duration?: number, meta?: LogMetadata) => {
    logger.info('API Response', { 
      method, 
      path, 
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString(),
      ...meta 
    });
  },
  
  webhookReceived: (source: string, eventType: string, meta?: LogMetadata) => {
    logger.info('Webhook Received', { 
      source, 
      eventType, 
      timestamp: new Date().toISOString(),
      ...meta 
    });
  },
  
  userAction: (action: string, userId: string, meta?: LogMetadata) => {
    logger.info('User Action', { 
      action, 
      userId, 
      timestamp: new Date().toISOString(),
      ...meta 
    });
  },
  
  adminAccess: (email: string, action: string, meta?: LogMetadata) => {
    logger.warn('Admin Access', { 
      email, 
      action, 
      timestamp: new Date().toISOString(),
      ...meta 
    });
  }
};

// Gracefully handle Winston errors
logger.on('error', (error) => {
  console.error('Logger error:', error);

});

// Flush logs before the process exits (only in Node.js runtime)
try {
  if (typeof process !== 'undefined' && process.on) {
    process.on('SIGINT', () => {
      logger.end();
    });

    process.on('SIGTERM', () => {
      logger.end();
    });
  }
} catch (error) {
  // Ignore errors in Edge Runtime
}

export default logger;