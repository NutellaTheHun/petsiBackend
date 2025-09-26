import { ValidationErrorNode } from './validation-error';

export class ValidationException extends Error {
  public readonly errors: ValidationErrorNode;

  constructor(errors: ValidationErrorNode, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationException';
    this.errors = errors;
  }
}
