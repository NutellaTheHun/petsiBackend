import {
    ValidationErrorMap,
    ValidationErrorResponse,
} from './validation-error';

export class ValidationException extends Error {
    /** Client-facing tree, without log-only context. */
    public readonly errors: ValidationErrorResponse;
    /** Source tree, read by `GlobalHttpExceptionFilter` for logged codes and their log-only context. */
    public readonly errorMap: ValidationErrorMap;

    constructor(errorMap: ValidationErrorMap, message = 'Validation failed') {
        super(message);
        this.name = 'ValidationException';
        this.errorMap = errorMap;
        this.errors = errorMap.buildResponse();
    }
}
