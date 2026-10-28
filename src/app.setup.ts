import {
    CanActivate,
    INestApplication,
    NestApplicationOptions,
    Provider,
    Type,
    ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import { Logger } from 'nestjs-pino';
import { DtoValidationException } from './common/exceptions/dto-validation-exception';
import { GlobalHttpExceptionFilter } from './common/exceptions/global-http-exception-filter';
import { requestIdHeaderMiddleware } from './common/middleware/request-id';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { FeatureGuard } from './modules/feature-flags/guards/feature.guard';
import { RoleGuard } from './modules/roles/guards/role.guard';

/**
 * Nest create options shared by production bootstrap and the HTTP test
 * harness. `rawBody` exposes `req.rawBody` (the exact request bytes) for
 * webhook signature verification.
 */
export const APP_CREATE_OPTIONS: NestApplicationOptions = {
    rawBody: true,
    bufferLogs: true, // hold startup logs until setupApp installs the pino logger
};

/**
 * Global guards, in the order they run. `AppModule` registers them as
 * `APP_GUARD`s; `createHttpTestApp` applies a stand-in for each name, so
 * adding a guard here fails compilation until the harness covers it too.
 */
export const GLOBAL_GUARDS = {
    auth: AuthGuard,
    role: RoleGuard,
    feature: FeatureGuard,
    throttler: ThrottlerGuard,
} satisfies Record<string, Type<CanActivate>>;

export type GlobalGuardName = keyof typeof GLOBAL_GUARDS;

export function globalGuardProviders(): Provider[] {
    return Object.values(GLOBAL_GUARDS).map((useClass) => ({
        provide: APP_GUARD,
        useClass,
    }));
}

/** Throttler limits; `get` reads a config value (ConfigService or env). */
export function throttlerOptions(
    get: (key: string) => string | undefined,
): ThrottlerModuleOptions {
    return {
        throttlers: [
            {
                ttl: Number(get('THROTTLE_TTL')) || 60000,
                //limit: config.get('THROTTLE_LIMIT') || 500,
                limit: get('NODE_ENV') === 'development' ? 999999 : 500,
            },
        ],
    };
}

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
