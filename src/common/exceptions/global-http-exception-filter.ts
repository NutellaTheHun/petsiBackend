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
import { resolveRequestId } from '../middleware/request-id';
import { ValidationException } from '../validation/validation-exception';
import { AppHttpException } from './app-http-exception';
import { DatabaseException } from './database-exception';

/**
 * The subset of nestjs-pino's `PinoLogger` the filter uses. Tests inject a
 * recording implementation (see `src/test/http-test-app.ts`).
 */
export type ExceptionFilterLogger = Pick<PinoLogger, 'debug' | 'info' | 'warn' | 'error'>;

@Catch()
@Injectable()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    constructor(
        @Inject(PinoLogger) private readonly logger: ExceptionFilterLogger,
    ) {}

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code: string | undefined = undefined;
        let details: any = undefined;

        if (exception instanceof AppHttpException) {
            status = exception.getStatus();
            const responseBody = exception.getResponse() as any;
            message = responseBody.message;
            code = responseBody.code;
            details = responseBody.details;
        } else if (exception instanceof ValidationException) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Validation failed';
            code = 'VALIDATION_ERROR';
            details = { validationErrors: exception.errors };
        } else if (exception instanceof DatabaseException) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Database error occured';
            code = 'DATABASE_ERROR';
            details = { databaseError: exception.error };
        }

        //Fall back
        else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseBody = exception.getResponse() as any;
            message =
                typeof responseBody === 'string' ? responseBody : responseBody.message;
            code = responseBody.code;
            details = responseBody.details;
        } else {
            message = exception.message || message;
        }

        const customResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId: resolveRequestId(request),
            message,
            code,
            details,
        };

        response.status(status).json(customResponse);
    }
}
