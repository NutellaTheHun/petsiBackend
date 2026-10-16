import { ValidationError } from 'class-validator';

/** One failed class-validator constraint, identified by path and constraint name only (never the value). */
export interface FailedConstraint {
    path: string;
    constraint: string;
}

/**
 * Thrown by the global `ValidationPipe`'s `exceptionFactory` when a request
 * body fails DTO (class-validator) checks. DTO checks mirror the frontend's,
 * so this is always a frontend bug: `GlobalHttpExceptionFilter` maps it to a
 * 400 `INVALID_REQUEST` and logs a warning.
 *
 * The raw `errors` still hold submitted values and the target object; only
 * `fieldPaths()`/`failedConstraints()` may reach a response or a log.
 */
export class DtoValidationException extends Error {
    constructor(
        readonly errors: ValidationError[],
        readonly dtoName: string | undefined,
    ) {
        super('DTO validation failed');
        this.name = 'DtoValidationException';
    }

    static fromErrors(errors: ValidationError[]): DtoValidationException {
        return new DtoValidationException(
            errors,
            errors[0]?.target?.constructor?.name,
        );
    }

    /** Every failed constraint as a dotted path (array indexes as segments), e.g. `orderedItems.2.quantity`. */
    failedConstraints(): FailedConstraint[] {
        const result: FailedConstraint[] = [];
        const walk = (errors: ValidationError[], parent?: string) => {
            for (const error of errors) {
                const path = parent
                    ? `${parent}.${error.property}`
                    : error.property;
                for (const constraint of Object.keys(error.constraints ?? {})) {
                    result.push({ path, constraint });
                }
                if (error.children?.length) walk(error.children, path);
            }
        };
        walk(this.errors);
        return result;
    }

    /** De-duplicated paths of every failed field. */
    fieldPaths(): string[] {
        return [...new Set(this.failedConstraints().map((c) => c.path))];
    }
}
