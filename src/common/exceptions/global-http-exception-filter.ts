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
import { DatabaseException } from './database-exception';

/**
 * The subset of nestjs-pino's `PinoLogger` the filter uses. Tests inject a
 * recording implementation (see `src/test/http-test-app.ts`).
 */
export type ExceptionFilterLogger = Pick<PinoLogger, 'debug' | 'info' | 'warn' | 'error'>;

/** The subset of `RequestContextService` the filter reads user/tenant ids from. */
export type ExceptionFilterRequestContext = Pick<RequestContextService, 'get'>;

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

const INTERNAL_ERROR_MESSAGE = 'Something went wrong';
const ALREADY_EXISTS_MESSAGE = 'This already exists';
const REFERENCE_CONFLICT_MESSAGE = 'A referenced item is in use or no longer exists';

type LogLevel = 'info' | 'warn' | 'error';

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
                { ...this.requestFields(request, requestId), ...result.log.fields },
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
            return {
                status: HttpStatus.BAD_REQUEST,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: { validationErrors: exception.errors },
            };
        }

        if (exception instanceof DatabaseException) {
            return this.classifyDatabaseException(exception);
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
                return this.serverError(exception);
            }
            // AppHttpException packs { message, code, details } into its response body too
            const responseBody = exception.getResponse() as any;
            return {
                status,
                message:
                    typeof responseBody === 'string' ? responseBody : responseBody.message,
                code: responseBody.code,
                details: responseBody.details,
            };
        }

        return this.serverError(exception);
    }

    private classifyDatabaseException(exception: DatabaseException): Classified {
        const pgError = (exception.error?.originalError as any)?.driverError;

        if (pgError?.code === PG_UNIQUE_VIOLATION) {
            return {
                status: HttpStatus.CONFLICT,
                message: ALREADY_EXISTS_MESSAGE,
                code: 'ALREADY_EXISTS',
                log: {
                    level: 'info',
                    fields: { source: 'server', constraint: pgError.constraint },
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

    private serverError(exception: any, pgError?: any): Classified {
        // Log the error closest to the cause; DatabaseException wraps the original TypeORM error
        const cause =
            exception instanceof DatabaseException &&
            exception.error?.originalError instanceof Error
                ? exception.error.originalError
                : exception;

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
    private requestFields(request: Request, requestId: string): Record<string, unknown> {
        return {
            requestId,
            method: request.method,
            route: request.route?.path ?? request.path,
            userId: this.requestContext.get<number>('userId'),
            tenantId: this.requestContext.get<number>('tenantId'),
        };
    }
}
