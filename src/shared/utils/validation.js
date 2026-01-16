"use strict";
/**
 * Input validation utilities using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInput = validateInput;
exports.safeValidateInput = safeValidateInput;
const zod_1 = require("zod");
const errors_1 = require("./errors");
/**
 * Validate input against a Zod schema
 * Throws IpcError with INVALID_INPUT code on validation failure
 */
function validateInput(schema, input) {
    try {
        return schema.parse(input);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            throw new errors_1.IpcError(errors_1.IPC_ERROR_CODES.INVALID_INPUT, 'Invalid input parameters', {
                errors: error.errors,
                input,
            });
        }
        throw error;
    }
}
/**
 * Safely validate input and return result with success/error
 */
function safeValidateInput(schema, input) {
    const result = schema.safeParse(input);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
}
