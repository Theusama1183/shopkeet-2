/**
 * Centralized error handling utilities
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown, correlationId?: string): NextResponse {
  console.error('Error occurred:', error, { correlationId });

  // Handle known error types
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.errorCode,
    };

    if (correlationId) {
      response.correlationId = correlationId;
    }

    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
        correlationId,
      },
      { status: 400 }
    );
  }

  // Handle database constraint errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any;
    
    if (dbError.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        {
          error: 'Resource already exists',
          code: 'CONFLICT_ERROR',
          correlationId,
        },
        { status: 409 }
      );
    }

    if (dbError.code === '23503') { // Foreign key constraint violation
      return NextResponse.json(
        {
          error: 'Referenced resource not found',
          code: 'REFERENCE_ERROR',
          correlationId,
        },
        { status: 400 }
      );
    }
  }

  // Generic error response (don't expose internal details)
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      correlationId,
    },
    { status: 500 }
  );
}

// Generate correlation ID for error tracking
export function generateCorrelationId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Async error handler wrapper
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const correlationId = generateCorrelationId();
    
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Async operation failed:', error, { correlationId });
      throw error;
    }
  };
}

// API route error handler wrapper
export function withApiErrorHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    const correlationId = generateCorrelationId();
    
    try {
      return await handler(req, context);
    } catch (error) {
      return formatErrorResponse(error, correlationId);
    }
  };
}