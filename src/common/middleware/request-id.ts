import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';

export const REQUEST_ID_HEADER = 'X-Request-Id';

type RequestWithId = IncomingMessage & { requestId?: string };

/**
 * Single source of the per-request id. Idempotent: the first caller (the
 * app-level middleware from `setupApp`, or pino-http's `genReqId` if it ever
 * runs first) resolves and stores the id on `req.requestId`; every later
 * caller gets the same value. Reuses a client-supplied `x-request-id` header.
 */
export function resolveRequestId(req: IncomingMessage): string {
    const request = req as RequestWithId;
    if (request.requestId) {
        return request.requestId;
    }
    const raw = req.headers['x-request-id'];
    const requestId = (Array.isArray(raw) ? raw[0] : raw) || randomUUID();
    request.requestId = requestId;
    return requestId;
}

/**
 * Express middleware registered by `setupApp` ahead of all module middleware
 * (including pino-http): resolves the id and echoes it on every response.
 */
export function requestIdHeaderMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
): void {
    res.setHeader(REQUEST_ID_HEADER, resolveRequestId(req));
    next();
}

/**
 * pino-http options that make the access line use the same id as the
 * request context and the exception filter.
 */
export const pinoHttpRequestIdOptions = {
    genReqId: (req: IncomingMessage) => resolveRequestId(req),
    customProps: (req: IncomingMessage) => ({
        requestId: resolveRequestId(req),
    }),
};
