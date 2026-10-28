import { CanActivate, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerStorageService } from '@nestjs/throttler';
import {
    APP_CREATE_OPTIONS,
    GLOBAL_GUARDS,
    GlobalGuardName,
    setupApp,
    throttlerOptions,
} from '../app.setup';
import { FeatureGuard } from '../modules/feature-flags/guards/feature.guard';
import { RequestContextService } from '../modules/request-context/RequestContextService';
import { RoleGuard } from '../modules/roles/guards/role.guard';
import { TestRequestContextService } from './mocks/test-request-context.service';
import { TestUser, TestUserGuard } from './test-user-guard';
import {
    ExceptionFilterLogger,
    GlobalHttpExceptionFilter,
} from '../common/exceptions/global-http-exception-filter';

export type RecordedLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RecordedLog {
    level: RecordedLogLevel;
    /** The structured first argument (or `undefined` for a message-only call). */
    payload: unknown;
    msg?: string;
}

/**
 * Logger injected into `GlobalHttpExceptionFilter` by `createHttpTestApp`.
 * Captures level + structured payload of every call so specs can assert on
 * what was (or wasn't) logged.
 */
export class RecordingLogger implements ExceptionFilterLogger {
    readonly logs: RecordedLog[] = [];

    debug(obj: unknown, msg?: string): void {
        this.record('debug', obj, msg);
    }
    info(obj: unknown, msg?: string): void {
        this.record('info', obj, msg);
    }
    warn(obj: unknown, msg?: string): void {
        this.record('warn', obj, msg);
    }
    error(obj: unknown, msg?: string): void {
        this.record('error', obj, msg);
    }

    clear(): void {
        this.logs.length = 0;
    }

    private record(level: RecordedLogLevel, obj: unknown, msg?: string): void {
        if (typeof obj === 'string') {
            this.logs.push({ level, payload: undefined, msg: obj });
        } else {
            this.logs.push({ level, payload: obj, msg });
        }
    }
}

export interface HttpTestAppOptions {
    /**
     * The signed-in user for each request (read per request, so a spec can
     * switch users between tests). Omitted: requests are unauthenticated and
     * only `@PublicLogin()` routes pass.
     */
    user?: () => TestUser | undefined;
    /** `false` opts out of the global guards entirely. */
    guards?: false;
    /** Runs after setup and guards, before `app.init()`. */
    beforeInit?: (app: INestApplication) => void;
}

/**
 * Test instance for each production global guard. Keyed by `GLOBAL_GUARDS`, so
 * a guard added there must get an entry here. `AuthGuard` is replaced by
 * `TestUserGuard` (no JWT); the others are the real guards.
 */
function testGlobalGuards(
    getUser: (() => TestUser | undefined) | undefined,
    requestContext: TestRequestContextService,
    throttlerStorage: ThrottlerStorageService,
) {
    const reflector = new Reflector();
    return {
        auth: new TestUserGuard(getUser, requestContext, reflector),
        role: new RoleGuard(reflector),
        feature: new FeatureGuard(reflector),
        throttler: new ThrottlerGuard(
            throttlerOptions((key) => process.env[key]),
            throttlerStorage,
            reflector,
        ),
    } satisfies Record<GlobalGuardName, CanActivate>;
}

/**
 * Builds a supertest-ready Nest app from an already-compiled domain testing
 * module with the production create options (`APP_CREATE_OPTIONS`), the
 * production `setupApp` (with a `RecordingLogger`-backed exception filter) and
 * the production global guards in `GLOBAL_GUARDS` order (see
 * `HttpTestAppOptions` for the user and opt-out).
 */
export async function createHttpTestApp(
    module: TestingModule,
    opts?: HttpTestAppOptions,
): Promise<{ app: INestApplication; logger: RecordingLogger }> {
    const logger = new RecordingLogger();
    const app = module.createNestApplication(APP_CREATE_OPTIONS);
    const requestContext = module.get<TestRequestContextService>(
        RequestContextService,
        { strict: false },
    );
    setupApp(app, {
        exceptionFilter: new GlobalHttpExceptionFilter(logger, requestContext),
    });
    if (opts?.guards !== false) {
        const throttlerStorage = new ThrottlerStorageService();
        const guards = testGlobalGuards(
            opts?.user,
            requestContext,
            throttlerStorage,
        );
        // Instances passed to useGlobalGuards get no lifecycle hooks: run the
        // throttler's init here, and clear its pending timers on close.
        await guards.throttler.onModuleInit();
        const close = app.close.bind(app) as INestApplication['close'];
        app.close = async () => {
            throttlerStorage.onApplicationShutdown();
            await close();
        };
        app.useGlobalGuards(
            ...(Object.keys(GLOBAL_GUARDS) as GlobalGuardName[]).map(
                (name) => guards[name],
            ),
        );
    }
    opts?.beforeInit?.(app);
    await app.init();
    return { app, logger };
}
