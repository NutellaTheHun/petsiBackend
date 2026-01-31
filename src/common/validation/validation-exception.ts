import { ValidationErrorResponse } from './validation-error';

export class ValidationException extends Error {
    public readonly errors: ValidationErrorResponse;

    constructor(errors: ValidationErrorResponse, message = 'Validation failed') {
        super(message);
        this.name = 'ValidationException';
        this.errors = errors;
    }
}
