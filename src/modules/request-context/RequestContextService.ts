import { HttpStatus, Injectable } from '@nestjs/common';
import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import { randomUUID } from 'crypto';
import { AppHttpException } from '../../common/exceptions/app-http-exception';

export const REQUEST_NAMESPACE = 'request';

/**
 * Recognized keys carried on the per-request CLS namespace. Not an enforced
 * schema — `get`/`set` remain generic string-keyed access (see `get<T>`) — this
 * exists purely to document what producers (e.g. `AuthGuard`, `RequestIdMiddleware`)
 * and consumers (e.g. `ServiceBase` subclasses, `RoleGuard`) agree the keys mean.
 */
export interface RequestContextValues {
    requestId?: string;
    userId?: number;
    roles?: string[];
    tenantId?: number;
    isTenantAdmin?: boolean;
    locations?: { locationId: number; roles: string[] }[];
    /**
     * Set by system writers acting on Square's behalf (the webhook path), so
     * `getRevisionActor` records `square_webhook` instead of `system`.
     */
    revisionActorType?: 'square_webhook';
    /**
     * Set by Square ingest and line conversion, which write Square-owned order
     * fields and lines; staff writes to those are rejected while the order is
     * linked (`OrderValidator`).
     */
    squareSystemWriter?: boolean;
}

@Injectable()
export class RequestContextService {
    run(callback: (...args: any[]) => void, context: RequestContextValues) {
        const ns = getRequestNamespace();
        ns.run(() => {
            for (const key in context) {
                ns.set(key, (context as Record<string, unknown>)[key]);
            }
            callback();
        });
    }

    /**
     * Runs `fn` in a child context with `context` layered over the current
     * one, for system writers (e.g. Square ingest) that call request-scoped
     * services outside a request, or as someone other than the caller. A key
     * set to `undefined` hides the outer value.
     */
    runWithContext<T>(
        context: RequestContextValues,
        fn: () => Promise<T>,
    ): Promise<T> {
        const ns = getRequestNamespace();
        return ns.runPromise(() => {
            for (const key in context) {
                ns.set(key, (context as Record<string, unknown>)[key]);
            }
            return fn();
        });
    }

    get<T = any>(key: string): T | undefined {
        return getRequestNamespace().get(key) as T | undefined;
    }

    getRequestId(): string {
        if (process.env.NODE_ENV !== 'production') {
            return `development-${randomUUID()}`;
        }
        const result = this.get<string>('requestId');
        if (!result) {
            throw new AppHttpException(
                'RequestContextService getRequestID is null',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
        return result;
    }
}

export function getRequestNamespace(): Namespace<Record<string, unknown>> {
    return (
        getNamespace(REQUEST_NAMESPACE) ?? createNamespace(REQUEST_NAMESPACE)
    );
}
