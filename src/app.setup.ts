import { INestApplication, ValidationPipe, BadRequestException } from '@nestjs/common';
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
    app.use(requestIdHeaderMiddleware);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // strips unknown properties
            forbidNonWhitelisted: true, // throws on unknown properties
            transform: true, // auto-transform payload to DTO instances
            exceptionFactory: (errors) => {
                console.error('Validation errors:', errors); // logs errors server-side
                return new BadRequestException(errors);
            },
        }),
    );

    app.useGlobalFilters(
        opts?.exceptionFilter ?? app.get(GlobalHttpExceptionFilter),
    );
}
