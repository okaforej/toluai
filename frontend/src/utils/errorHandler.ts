/**
 * Comprehensive Error Handling Utilities
 * Centralized error handling for API calls and user feedback
 */

import React from 'react';
import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
}

export interface ErrorState {
  hasError: boolean;
  error: ApiError | null;
  isLoading: boolean;
}

export class ErrorHandler {
  /**
   * Parse API error response into user-friendly message
   */
  static parseError(error: any): ApiError {
    // Handle network errors
    if (!error.response) {
      return {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
      };
    }

    const { status, data } = error.response as AxiosError['response'];

    // Handle different HTTP status codes
    switch (status) {
      case 400:
        return {
          message: data?.error || 'Invalid request. Please check your input.',
          code: 'BAD_REQUEST',
          details: data,
        };

      case 401:
        return {
          message: 'Authentication required. Please log in and try again.',
          code: 'UNAUTHORIZED',
        };

      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
        };

      case 404:
        return {
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
        };

      case 409:
        return {
          message: data?.error || 'A conflict occurred. This resource may already exist.',
          code: 'CONFLICT',
        };

      case 422:
        return {
          message: data?.error || 'Validation failed. Please check your input.',
          code: 'VALIDATION_ERROR',
          field: data?.field,
          details: data?.validation_errors,
        };

      case 429:
        return {
          message: 'Too many requests. Please wait a moment before trying again.',
          code: 'RATE_LIMITED',
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          message: 'Server error. Please try again later or contact support.',
          code: 'SERVER_ERROR',
        };

      default:
        return {
          message: data?.error || `An error occurred (${status}). Please try again.`,
          code: 'UNKNOWN_ERROR',
        };
    }
  }

  /**
   * Handle API errors with toast notifications
   */
  static handleError(error: any, customMessage?: string): ApiError {
    const apiError = this.parseError(error);

    if (customMessage) {
      apiError.message = customMessage;
    }

    // Log error for debugging
    console.error('API Error:', error, apiError);

    return apiError;
  }

  /**
   * Create initial error state
   */
  static createInitialState(): ErrorState {
    return {
      hasError: false,
      error: null,
      isLoading: false,
    };
  }

  /**
   * Set loading state
   */
  static setLoading(setState: (state: ErrorState) => void): void {
    setState({
      hasError: false,
      error: null,
      isLoading: true,
    });
  }

  /**
   * Set error state
   */
  static setError(setState: (state: ErrorState) => void, error: any, customMessage?: string): void {
    const apiError = this.handleError(error, customMessage);
    setState({
      hasError: true,
      error: apiError,
      isLoading: false,
    });
  }

  /**
   * Set success state
   */
  static setSuccess(setState: (state: ErrorState) => void): void {
    setState({
      hasError: false,
      error: null,
      isLoading: false,
    });
  }

  /**
   * Clear error state
   */
  static clearError(setState: (state: ErrorState) => void): void {
    setState((prevState) => ({
      ...prevState,
      hasError: false,
      error: null,
    }));
  }
}

/**
 * React hook for managing error state
 */
export const useErrorState = (initialState: ErrorState = ErrorHandler.createInitialState()) => {
  const [state, setState] = React.useState<ErrorState>(initialState);

  const setLoading = () => ErrorHandler.setLoading(setState);
  const setError = (error: any, customMessage?: string) =>
    ErrorHandler.setError(setState, error, customMessage);
  const setSuccess = () => ErrorHandler.setSuccess(setState);
  const clearError = () => ErrorHandler.clearError(setState);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    clearError,
  };
};

/**
 * Retry mechanism for failed API calls
 */
export class RetryHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          throw error;
        }

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }

    throw lastError;
  }
}

/**
 * Validation helpers
 */
export class ValidationHelper {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateRequired(value: any, fieldName: string): string | null {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  static validateForm(
    data: Record<string, any>,
    rules: Record<string, any[]>
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    Object.keys(rules).forEach((field) => {
      const value = data[field];
      const fieldRules = rules[field];

      for (const rule of fieldRules) {
        if (typeof rule === 'function') {
          const error = rule(value, field);
          if (error) {
            errors[field] = error;
            break;
          }
        }
      }
    });

    return errors;
  }
}

export default ErrorHandler;
