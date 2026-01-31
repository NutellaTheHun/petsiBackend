import { AppLogger } from '../../modules/app-logging/app-logger';
import { ValidationErrorResponse } from './validation-error';
import { ValidationException } from './validation-exception';

export class ValidationExceptionHandler {
    constructor(private logger: AppLogger) { }

    public handle(
        errors: ValidationErrorResponse,
        validationPrefix: string,
        requestId: string,
    ): ValidationException {
        const exception = new ValidationException(errors);
        this.logger.logError(
            validationPrefix,
            requestId,
            'VALIDATION',
            exception.errors,
        );
        return exception;
    }
}
