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
}

@Injectable()
export class RequestContextService {
  run(callback: (...args: any[]) => void, context: RequestContextValues) {
    const ns = getRequestNamespace();
    ns.run(() => {
      for (const key in context) {
        ns.set(key, (context as Record<string, any>)[key]);
      }
      callback();
    });
  }

  get<T = any>(key: string): T | undefined {
    return getRequestNamespace().get(key);
  }

  getRequestId(): string {
    if (process.env.NODE_ENV !== 'production') {
      return `development-${randomUUID()}`;
    }
    const result = this.get('requestId');
    if (!result) {
      throw new AppHttpException(
        'RequestContextService getRequestID is null',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result;
  }
}

export function getRequestNamespace(): Namespace {
  return getNamespace(REQUEST_NAMESPACE) ?? createNamespace(REQUEST_NAMESPACE);
}
