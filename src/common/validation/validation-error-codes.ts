export type ValidationErrorCode =
    | 'MISSING_PROPERTY'
    | 'ALREADY_EXISTS'
    | 'DUPLICATE_ITEMS'
    | 'IMMUTABLE_FIELD'
    | 'REFERENCE_NOT_FOUND'
    | 'INVALID_REFERENCE'
    | 'INCONSISTENT_STATE'
    | 'OUT_OF_RANGE'
    | 'CONFLICTING_VALUES';

/**
 * Whether `GlobalHttpExceptionFilter` logs a validation error with this code.
 * Logged codes are anomalies the UI should have prevented; the rest are errors the user can fix.
 * Typed as a full Record so adding a code without classifying it fails to compile.
 */
export const VALIDATION_ERROR_CODE_LOGGED: Record<
    ValidationErrorCode,
    boolean
> = {
    REFERENCE_NOT_FOUND: true,
    INVALID_REFERENCE: true,
    INCONSISTENT_STATE: true,
    IMMUTABLE_FIELD: true,
    DUPLICATE_ITEMS: true,

    ALREADY_EXISTS: false,
    MISSING_PROPERTY: false,
    OUT_OF_RANGE: false,
    CONFLICTING_VALUES: false,
};
