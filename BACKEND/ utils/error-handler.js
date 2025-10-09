class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = {
    // Centralized error handling middleware
    handleError: (err, req, res, next) => {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // MongoDB duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                error: `${field} already exists`,
                errorCode: 'DUPLICATE_ENTRY'
            });
        }

        // MongoDB validation error
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({
                success: false,
                error: errors.join(', '),
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // JWT errors
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                errorCode: 'INVALID_TOKEN'
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                errorCode: 'TOKEN_EXPIRED'
            });
        }

        // Custom AppError
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                error: err.message,
                errorCode: err.errorCode
            });
        }

        // Unknown errors (don't leak details in production)
        res.status(500).json({
            success: false,
            error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
            errorCode: 'INTERNAL_SERVER_ERROR'
        });
    },

    // Async error wrapper (avoid try-catch blocks)
    catchAsync: (fn) => {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    },

    // Create specific error types
    createError: {
        notFound: (message = 'Resource not found') => {
            return new AppError(message, 404, 'NOT_FOUND');
        },
        badRequest: (message = 'Bad request') => {
            return new AppError(message, 400, 'BAD_REQUEST');
        },
        unauthorized: (message = 'Not authorized') => {
            return new AppError(message, 401, 'UNAUTHORIZED');
        },
        forbidden: (message = 'Access forbidden') => {
            return new AppError(message, 403, 'FORBIDDEN');
        },
        internalError: (message = 'Internal server error') => {
            return new AppError(message, 500, 'INTERNAL_ERROR');
        }
    },

    // Log error with context
    logError: (error, context = {}) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack,
            context: context,
            environment: process.env.NODE_ENV
        };
        
        console.error('Application Error:', JSON.stringify(logEntry, null, 2));
        
        // Here you can add integration with error monitoring services
        // like Sentry, LogRocket, etc.
    }
};

module.exports = { errorHandler, AppError };
