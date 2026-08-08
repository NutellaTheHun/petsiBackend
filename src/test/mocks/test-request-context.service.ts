import { Injectable } from '@nestjs/common';
import { RequestContextService, RequestContextValues } from '../../modules/request-context/RequestContextService';

@Injectable()
export class TestRequestContextService implements RequestContextService {
    private context = new Map<string, any>();

    run(callback: () => void, context: RequestContextValues) {
        for (const key in context) {
            this.context.set(key, (context as Record<string, any>)[key]);
        }
        callback();
    }

    get<T = any>(key: string): T | undefined {
        return this.context.get(key);
    }

    getRequestId(): string {
        return this.get('requestId') || 'test-request-id';
    }

    /**
     * Convenience for a spec's beforeEach/beforeAll to seed context values
     * (e.g. tenantId, isTenantAdmin, locations) without a request lifecycle.
     * Equivalent to `run(() => {}, context)`.
     */
    setContext(context: RequestContextValues): void {
        this.run(() => {}, context);
    }
}