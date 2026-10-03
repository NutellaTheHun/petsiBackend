import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { setupApp } from '../app.setup';
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

/**
 * Builds a supertest-ready Nest app from an already-compiled domain testing
 * module, applying the production `setupApp` with a `RecordingLogger`-backed
 * exception filter. `beforeInit` runs after setup and before `app.init()`
 * (e.g. to add global guards).
 */
export async function createHttpTestApp(
    module: TestingModule,
    opts?: { beforeInit?: (app: INestApplication) => void },
): Promise<{ app: INestApplication; logger: RecordingLogger }> {
    const logger = new RecordingLogger();
    const app = module.createNestApplication();
    setupApp(app, { exceptionFilter: new GlobalHttpExceptionFilter(logger) });
    opts?.beforeInit?.(app);
    await app.init();
    return { app, logger };
}
