import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DtoValidationException } from './common/exceptions/dto-validation-exception';
import { GlobalHttpExceptionFilter } from './common/exceptions/global-http-exception-filter';
import { requestIdHeaderMiddleware } from './common/middleware/request-id';

export interface SetupAppOptions {
    /**
     * Filter instance to register. Defaults to the DI-resolved
     * `GlobalHttpExceptionFilter` (provided by `ExceptionsModule`). Tests pass
     * one constructed with a recording logger.
     */
    exceptionFilter?: GlobalHttpExceptionFilter;
}

/**
 * Request-pipeline setup shared by production bootstrap and the HTTP test
 * harness. Must be called before `app.init()`/`app.listen()` so the request-id
 * middleware is registered ahead of module middleware (pino-http included).
 */
export function setupApp(app: INestApplication, opts?: SetupAppOptions): void {
    app.useLogger(app.get(Logger));

    app.use(requestIdHeaderMiddleware);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // strips unknown properties
            forbidNonWhitelisted: true, // throws on unknown properties
            transform: true, // auto-transform payload to DTO instances
            exceptionFactory: (errors) =>
                DtoValidationException.fromErrors(errors),
        }),
    );

    app.useGlobalFilters(
        opts?.exceptionFilter ?? app.get(GlobalHttpExceptionFilter),
    );
}
