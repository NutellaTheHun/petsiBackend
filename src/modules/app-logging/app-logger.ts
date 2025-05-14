import { Injectable } from "@nestjs/common";
import { Logger } from "nestjs-pino";

@Injectable()
export class AppLogger {
    constructor(private readonly logger: Logger) {}

    logAction(
        context: string,
        requestId: string,
        action: string,
        status: 'REQUEST' | 'SUCCESS' | 'FAIL' | 'CACHE HIT' | 'RESULT CACHED' | 'CACHE INVALIDATED',
        details?: Record<string, any>
    ) {
        this.logger.log({
            context,
            requestId,
            action,
            status,
            ...details,
        });
    }

    logError(
        context: string,
        requestId: string,
        action: string,
        error: unknown,
        details?: Record<string, any>
    ) {
        this.logger.error({
            context,
            requestId,
            action,
            status: 'FAIL',
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            ...details,
        });
    }
}