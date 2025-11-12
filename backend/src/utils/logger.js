/**
 * Logging System
 * Provides structured logging for the application
 */

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Get current timestamp in ISO format
 */
const getTimestamp = () => new Date().toISOString();

/**
 * Format log message
 */
const formatLog = (level, message, meta = {}) => {
  const log = {
    timestamp: getTimestamp(),
    level,
    message,
    ...meta
  };

  // In development, use pretty printing
  if (process.env.NODE_ENV === 'development') {
    return JSON.stringify(log, null, 2);
  }

  // In production, use compact JSON
  return JSON.stringify(log);
};

/**
 * Console logger with color support
 */
const consoleLog = (level, message, meta = {}) => {
  const formattedLog = formatLog(level, message, meta);
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedLog);
      break;
    case LogLevel.WARN:
      console.warn(formattedLog);
      break;
    case LogLevel.INFO:
      console.info(formattedLog);
      break;
    case LogLevel.DEBUG:
      console.debug(formattedLog);
      break;
    default:
      console.log(formattedLog);
  }
};

/**
 * Log error with context
 */
export const logError = (error, req = null) => {
  const meta = {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  };

  // Add request context if available
  if (req) {
    meta.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Add user context if authenticated
    if (req.user) {
      meta.user = {
        id: req.user.id,
        email: req.user.email,
        userType: req.user.userType
      };
    }
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    meta.error.stack = error.stack;
  }

  consoleLog(LogLevel.ERROR, error.message, meta);

  // TODO: Send to external error tracking service (Sentry) in production
  if (process.env.NODE_ENV === 'production') {
    // sendToSentry(error, meta);
  }
};

/**
 * Log warning
 */
export const logWarn = (message, meta = {}) => {
  consoleLog(LogLevel.WARN, message, meta);
};

/**
 * Log info
 */
export const logInfo = (message, meta = {}) => {
  consoleLog(LogLevel.INFO, message, meta);
};

/**
 * Log debug (only in development)
 */
export const logDebug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    consoleLog(LogLevel.DEBUG, message, meta);
  }
};

/**
 * Log API request
 */
export const logRequest = (req, res, duration) => {
  const meta = {
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent')
    },
    response: {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    }
  };

  // Add user context if authenticated
  if (req.user) {
    meta.user = {
      id: req.user.id,
      userType: req.user.userType
    };
  }

  // Log as INFO for successful requests, WARN for client errors, ERROR for server errors
  if (res.statusCode >= 500) {
    consoleLog(LogLevel.ERROR, `${req.method} ${req.originalUrl}`, meta);
  } else if (res.statusCode >= 400) {
    consoleLog(LogLevel.WARN, `${req.method} ${req.originalUrl}`, meta);
  } else {
    consoleLog(LogLevel.INFO, `${req.method} ${req.originalUrl}`, meta);
  }
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req, res, duration);
  });

  next();
};

/**
 * Log database query (for debugging)
 */
export const logQuery = (query, params = [], duration = null) => {
  if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
    const meta = {
      query: {
        sql: query,
        params,
        ...(duration && { duration: `${duration}ms` })
      }
    };
    consoleLog(LogLevel.DEBUG, 'Database Query', meta);
  }
};

/**
 * Log external API call
 */
export const logExternalAPI = (service, method, url, statusCode, duration) => {
  const meta = {
    service,
    request: {
      method,
      url
    },
    response: {
      statusCode,
      duration: `${duration}ms`
    }
  };

  if (statusCode >= 500) {
    consoleLog(LogLevel.ERROR, `External API Error: ${service}`, meta);
  } else if (statusCode >= 400) {
    consoleLog(LogLevel.WARN, `External API Warning: ${service}`, meta);
  } else {
    consoleLog(LogLevel.INFO, `External API Call: ${service}`, meta);
  }
};

/**
 * Create a logger instance for a specific module
 */
export const createLogger = (moduleName) => {
  return {
    error: (message, meta = {}) => logError({ message, name: moduleName, ...meta }),
    warn: (message, meta = {}) => logWarn(message, { module: moduleName, ...meta }),
    info: (message, meta = {}) => logInfo(message, { module: moduleName, ...meta }),
    debug: (message, meta = {}) => logDebug(message, { module: moduleName, ...meta })
  };
};

/**
 * Sentry integration placeholder
 * TODO: Implement when Sentry is configured
 */
const sendToSentry = (error, meta) => {
  // Example Sentry integration:
  // const Sentry = require('@sentry/node');
  // Sentry.captureException(error, {
  //   extra: meta
  // });
};

export default {
  logError,
  logWarn,
  logInfo,
  logDebug,
  logRequest,
  requestLogger,
  logQuery,
  logExternalAPI,
  createLogger
};
