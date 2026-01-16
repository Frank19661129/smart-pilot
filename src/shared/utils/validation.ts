/**
 * Input validation utilities using Zod
 */

import { z } from 'zod';
import { IpcError, IPC_ERROR_CODES } from './errors';

/**
 * Validate input against a Zod schema
 * Throws IpcError with INVALID_INPUT code on validation failure
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new IpcError(
        IPC_ERROR_CODES.INVALID_INPUT,
        'Invalid input parameters',
        {
          errors: error.errors,
          input,
        }
      );
    }
    throw error;
  }
}

/**
 * Safely validate input and return result with success/error
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
