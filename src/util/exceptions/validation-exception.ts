import { ValidationError } from "./validation-error";

export class ValidationException extends Error {
    public readonly errors: ValidationError[];

    constructor(errors: ValidationError[] | ValidationError, message = 'Validation failed') {
        super(message);
        this.name = 'ValidationException';
        this.errors = Array.isArray(errors) ? errors : [errors];
    }
}