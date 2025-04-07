import { Middleware, ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { Request, Response, NextFunction } from 'express';
import { Service } from 'typedi';

/**
 * Global error handler middleware
 * Removes error stack traces from responses for security
 */
@Middleware({ type: 'after' })
@Service()
export class GlobalErrorHandler implements ExpressErrorMiddlewareInterface {

    error(error: any, request: Request, response: Response, next: NextFunction): void {
        // Get HTTP status code from error if available, default to 500
        const status = error.httpCode || error.status || 500;

        // Create sanitized error response
        const errorResponse = {
            success: false,
            status,
            name: error.name,
            message: error.message || 'Something went wrong',
            // Additional information you might want to include
            timestamp: new Date().toISOString(),
            path: request.path,
            method: request.method
        };

        // Log the full error with stack for server-side debugging
        console.error('Error occurred:', {
            ...errorResponse,
            stack: error.stack
        });

        // Send sanitized response to client (without stack trace)
        response.status(status).json(errorResponse);
    }
}