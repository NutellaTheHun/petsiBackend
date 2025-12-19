import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../../modules/request-context/RequestContextService';

@Injectable()
export class TestRequestContextService implements RequestContextService {
    private context = new Map<string, any>();

    run(callback: () => void, context: Record<string, any>) {
        for (const key in context) {
            this.context.set(key, context[key]);
        }
        callback();
    }

    get<T = any>(key: string): T | undefined {
        return this.context.get(key);
    }

    getRequestId(): string {
        return this.get('requestId') || 'test-request-id';
    }
}