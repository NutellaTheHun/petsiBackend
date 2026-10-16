import {
    ApiProperty,
    ApiPropertyOptional,
    getSchemaPath,
} from '@nestjs/swagger';
import {
    VALIDATION_ERROR_CODE_LOGGED,
    ValidationErrorCode,
} from '../validation/validation-error-codes';

/**
 * Swagger-only schemas for the error envelope `GlobalHttpExceptionFilter` writes.
 * Registered as `extraModels` in `main.ts` so the generated frontend types include them.
 */

export const VALIDATION_ERROR_CODES = Object.keys(
    VALIDATION_ERROR_CODE_LOGGED,
) as ValidationErrorCode[];

/** Top-level `code` values the filter can return. */
export const ERROR_RESPONSE_CODES = [
    'VALIDATION_ERROR',
    'INVALID_REQUEST',
    'ALREADY_EXISTS',
    'REFERENCE_CONFLICT',
    'INTERNAL_ERROR',
    'REFERENCE_NOT_FOUND',
] as const;

export type ErrorResponseCode = (typeof ERROR_RESPONSE_CODES)[number];

export class ValidationErrorPayloadDto {
    @ApiProperty({
        enum: VALIDATION_ERROR_CODES,
        enumName: 'ValidationErrorCode',
    })
    errorCode: ValidationErrorCode;

    @ApiPropertyOptional({
        type: 'array',
        items: { oneOf: [{ type: 'string' }, { type: 'number' }] },
    })
    ids?: (string | number)[];

    @ApiPropertyOptional({ type: [String] })
    fields?: string[];
}

export class ValidationErrorResponseDto {
    @ApiPropertyOptional({ oneOf: [{ type: 'string' }, { type: 'number' }] })
    id?: string | number;

    @ApiPropertyOptional({ type: [ValidationErrorPayloadDto] })
    errorPayload?: ValidationErrorPayloadDto[];

    @ApiPropertyOptional({
        type: 'object',
        additionalProperties: {
            type: 'array',
            items: { $ref: getSchemaPath('ValidationErrorResponseDto') },
        },
    })
    nestedErrors?: Record<string, ValidationErrorResponseDto[]>;
}

/** `details` when `code` is `VALIDATION_ERROR`. */
export class ValidationErrorDetailsDto {
    @ApiProperty({ type: ValidationErrorResponseDto })
    validationErrors: ValidationErrorResponseDto;
}

/** `details` when `code` is `INVALID_REQUEST`: dotted property paths, array indexes as segments. */
export class InvalidRequestDetailsDto {
    @ApiProperty({ type: [String] })
    fields: string[];
}

export class ErrorResponseDto {
    @ApiProperty()
    statusCode: number;

    @ApiProperty({ format: 'date-time' })
    timestamp: string;

    @ApiProperty()
    path: string;

    @ApiProperty()
    requestId: string;

    @ApiProperty()
    message: string;

    @ApiPropertyOptional({
        enum: ERROR_RESPONSE_CODES,
        enumName: 'ErrorResponseCode',
    })
    code?: ErrorResponseCode;

    @ApiPropertyOptional({
        oneOf: [
            { $ref: getSchemaPath(ValidationErrorDetailsDto) },
            { $ref: getSchemaPath(InvalidRequestDetailsDto) },
        ],
    })
    details?: ValidationErrorDetailsDto | InvalidRequestDetailsDto;
}

export const ERROR_RESPONSE_MODELS = [
    ErrorResponseDto,
    ValidationErrorDetailsDto,
    InvalidRequestDetailsDto,
    ValidationErrorResponseDto,
    ValidationErrorPayloadDto,
];
