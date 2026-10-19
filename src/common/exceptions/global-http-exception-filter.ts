import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { RequestContextService } from '../../modules/request-context/RequestContextService';
import { resolveRequestId } from '../middleware/request-id';
import { ValidationException } from '../validation/validation-exception';
import { AppHttpException } from './app-http-exception';
import { PgDriverError, pgDriverErrorOf } from './database-error';
import { DatabaseException } from './database-exception';
import { DtoValidationException } from './dto-validation-exception';
import { REFERENCE_NOT_FOUND } from './error_constants';

/**
 * The subset of nestjs-pino's `PinoLogger` the filter uses. Tests inject a
 * recording implementation (see `src/test/http-test-app.ts`).
 */
export type ExceptionFilterLogger = Pick<
    PinoLogger,
    'debug' | 'info' | 'warn' | 'error'
>;

/** The subset of `RequestContextService` the filter reads user/tenant ids from. */
export type ExceptionFilterRequestContext = Pick<RequestContextService, 'get'>;

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

const INVALID_REQUEST_MESSAGE = "This request couldn't be processed";
const INTERNAL_ERROR_MESSAGE = 'Something went wrong';
const ALREADY_EXISTS_MESSAGE = 'This already exists';
const REFERENCE_CONFLICT_MESSAGE =
    'A referenced item is in use or no longer exists';

const SERVER_ERROR_MIN_STATUS: number = HttpStatus.INTERNAL_SERVER_ERROR;

type LogLevel = 'info' | 'warn' | 'error';

/** The response body of a Nest `HttpException`; `AppHttpException` fills all three fields. */
type HttpExceptionBody =
    | string
    | { message?: string; code?: string; details?: unknown };

interface Classified {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
    log?: { level: LogLevel; fields: Record<string, unknown>; msg: string };
}

@Catch()
@Injectable()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    constructor(
        @Inject(PinoLogger) private readonly logger: ExceptionFilterLogger,
        @Inject(RequestContextService)
        private readonly requestContext: ExceptionFilterRequestContext,
    ) {}

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const requestId = resolveRequestId(request);

        const result = this.classify(exception);

        if (result.log) {
            this.logger[result.log.level](
                {
                    ...this.requestFields(request, requestId),
                    ...result.log.fields,
                },
                result.log.msg,
            );
        }

        const customResponse = {
            statusCode: result.status,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId,
            message: result.message,
            code: result.code,
            details: result.details,
        };

        response.status(result.status).json(customResponse);
    }

    /**
     * Maps an exception to its public response and (optionally) a log entry.
     * Database/server internals only ever reach the log, never the response.
     */
    private classify(exception: any): Classified {
        if (exception instanceof ValidationException) {
            // Only anomalous codes are logged; errors the user can fix are left out
            const loggedErrors = exception.errorMap.collectLoggedErrors();
            return {
                status: HttpStatus.BAD_REQUEST,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: { validationErrors: exception.errors },
                log: loggedErrors.length
                    ? {
                          level: 'warn',
                          fields: { source: 'business', errors: loggedErrors },
                          msg: 'Business validation anomaly',
                      }
                    : undefined,
            };
        }

        if (exception instanceof DtoValidationException) {
            // DTO checks mirror the frontend's, so a shape failure is a frontend bug: log it.
            // Paths and constraint names only; the raw errors carry submitted values.
            return {
                status: HttpStatus.BAD_REQUEST,
                message: INVALID_REQUEST_MESSAGE,
                code: 'INVALID_REQUEST',
                details: { fields: exception.fieldPaths() },
                log: {
                    level: 'warn',
                    fields: {
                        source: 'dto',
                        dto: exception.dtoName,
                        constraints: exception.failedConstraints(),
                    },
                    msg: 'DTO shape validation failed',
                },
            };
        }

        if (exception instanceof DatabaseException) {
            return this.classifyDatabaseException(exception);
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            if (status >= SERVER_ERROR_MIN_STATUS) {
                return this.serverError(exception);
            }
            // AppHttpException packs { message, code, details } into its response body too
            const responseBody = exception.getResponse() as HttpExceptionBody;
            const body =
                typeof responseBody === 'string'
                    ? { message: responseBody }
                    : responseBody;
            return {
                status,
                message: body.message ?? '',
                code: body.code,
                details: body.details,
                log:
                    exception instanceof AppHttpException &&
                    exception.code === REFERENCE_NOT_FOUND
                        ? {
                              level: 'warn',
                              // ids only; a by-name lookup's name is not logged
                              fields: {
                                  source: 'business',
                                  code: REFERENCE_NOT_FOUND,
                                  id: exception.details?.id,
                                  ids: exception.details?.ids,
                              },
                              msg: 'Referenced entity not found',
                          }
                        : undefined,
            };
        }

        return this.serverError(exception);
    }

    private classifyDatabaseException(
        exception: DatabaseException,
    ): Classified {
        const pgError = pgDriverErrorOf(exception.error?.originalError);

        if (pgError?.code === PG_UNIQUE_VIOLATION) {
            return {
                status: HttpStatus.CONFLICT,
                message: ALREADY_EXISTS_MESSAGE,
                code: 'ALREADY_EXISTS',
                log: {
                    level: 'info',
                    fields: {
                        source: 'server',
                        constraint: pgError.constraint,
                    },
                    msg: 'Unique constraint violation',
                },
            };
        }

        if (pgError?.code === PG_FOREIGN_KEY_VIOLATION) {
            return {
                status: HttpStatus.CONFLICT,
                message: REFERENCE_CONFLICT_MESSAGE,
                code: 'REFERENCE_CONFLICT',
                log: {
                    level: 'warn',
                    fields: {
                        source: 'server',
                        constraint: pgError.constraint,
                        table: pgError.table,
                    },
                    msg: 'Foreign key constraint violation',
                },
            };
        }

        return this.serverError(exception, pgError);
    }

    private serverError(
        exception: unknown,
        pgError?: PgDriverError,
    ): Classified {
        // Log the error closest to the cause; DatabaseException wraps the original TypeORM error
        const cause = (
            exception instanceof DatabaseException &&
            exception.error?.originalError instanceof Error
                ? exception.error.originalError
                : exception
        ) as Partial<Error> | null | undefined;

        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: INTERNAL_ERROR_MESSAGE,
            code: 'INTERNAL_ERROR',
            log: {
                level: 'error',
                fields: {
                    source: 'server',
                    // Explicit fields only: QueryFailedError carries SQL parameters (request values)
                    err: {
                        type: cause?.name,
                        message: cause?.message,
                        stack: cause?.stack,
                    },
                    pgCode: pgError?.code,
                    pgDetail: pgError?.detail,
                },
                msg: 'Unhandled server error',
            },
        };
    }

    /** Fields every filter log entry carries. Never includes the request body. */
    private requestFields(
        request: Request,
        requestId: string,
    ): Record<string, unknown> {
        return {
            requestId,
            method: request.method,
            route:
                (request.route as { path?: string } | undefined)?.path ??
                request.path,
            userId: this.requestContext.get<number>('userId'),
            tenantId: this.requestContext.get<number>('tenantId'),
        };
    }
}
