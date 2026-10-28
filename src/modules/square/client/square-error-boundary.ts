import { HttpStatus } from '@nestjs/common';
import { SquareError, SquareTimeoutError } from 'square';
import { AppHttpException } from '../../../common/exceptions/app-http-exception';

export const SQUARE_NOT_CONNECTED = 'SQUARE_NOT_CONNECTED';
export const SQUARE_REAUTH_REQUIRED = 'SQUARE_REAUTH_REQUIRED';
export const SQUARE_NOT_FOUND = 'SQUARE_NOT_FOUND';

/** The tenant has no usable connection (none, or `disconnected`). */
export class SquareNotConnectedException extends AppHttpException {
    constructor() {
        super(
            'Square is not connected',
            HttpStatus.CONFLICT,
            SQUARE_NOT_CONNECTED,
        );
    }
}

/**
 * Square rejected the tenant's token (401), or the connection is already
 * `needs_reauth`. A 409 rather than a 401, so the frontend doesn't treat it as
 * its own session expiring. Catch this type to set `needs_reauth`.
 */
export class SquareReauthRequiredException extends AppHttpException {
    constructor() {
        super(
            'The Square connection needs to be re-authorized',
            HttpStatus.CONFLICT,
            SQUARE_REAUTH_REQUIRED,
        );
    }
}

export class SquareNotFoundException extends AppHttpException {
    constructor() {
        super(
            'The Square object was not found',
            HttpStatus.NOT_FOUND,
            SQUARE_NOT_FOUND,
        );
    }
}

/**
 * Any other Square failure (5xx, 429, timeout, or a 4xx caused by our own
 * request). A 502 is a server error, so the global filter returns an opaque
 * 500 and logs this message, which carries only the status and Square's error
 * codes, never `detail` or the body (they can contain merchant data).
 */
export class SquareUpstreamException extends AppHttpException {
    constructor(summary: string) {
        super(`Square request failed: ${summary}`, HttpStatus.BAD_GATEWAY);
    }
}

/**
 * Converts a Square SDK error into the app's typed exceptions; anything else is
 * returned unchanged. Doesn't log: the global filter is the only error logger.
 */
export function toSquareAppException(err: unknown): unknown {
    if (err instanceof SquareTimeoutError) {
        return new SquareUpstreamException('timeout');
    }
    if (!(err instanceof SquareError)) {
        return err;
    }
    switch (err.statusCode) {
        case HttpStatus.UNAUTHORIZED:
            return new SquareReauthRequiredException();
        case HttpStatus.NOT_FOUND:
            return new SquareNotFoundException();
        default: {
            const codes = err.errors.map((e) => e.code).join(',');
            return new SquareUpstreamException(
                `status ${err.statusCode ?? 'unknown'}${codes ? ` (${codes})` : ''}`,
            );
        }
    }
}

/** Runs one Square call, converting SDK errors at the module boundary. */
export async function callSquare<T>(call: () => Promise<T>): Promise<T> {
    try {
        return await call();
    } catch (err) {
        throw toSquareAppException(err);
    }
}
