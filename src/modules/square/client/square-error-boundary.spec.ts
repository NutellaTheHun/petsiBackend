import { HttpStatus } from '@nestjs/common';
import { SquareError, SquareTimeoutError } from 'square';
import {
    callSquare,
    SquareNotFoundException,
    SquareReauthRequiredException,
    SquareUpstreamException,
    toSquareAppException,
} from './square-error-boundary';

function squareError(statusCode: number, detail = 'merchant data here') {
    return new SquareError({
        statusCode,
        body: {
            errors: [
                {
                    category: 'API_ERROR',
                    code: 'INTERNAL_SERVER_ERROR',
                    detail,
                },
            ],
        },
    });
}

describe('square error boundary', () => {
    it('turns a Square 401 into a reauth-required 409', () => {
        const converted = toSquareAppException(squareError(401));
        expect(converted).toBeInstanceOf(SquareReauthRequiredException);
        expect((converted as SquareReauthRequiredException).getStatus()).toBe(
            HttpStatus.CONFLICT,
        );
    });

    it('turns a Square 404 into a 404', () => {
        expect(toSquareAppException(squareError(404))).toBeInstanceOf(
            SquareNotFoundException,
        );
    });

    it('turns other Square failures into a 502 carrying codes but not details', () => {
        const converted = toSquareAppException(squareError(500));
        expect(converted).toBeInstanceOf(SquareUpstreamException);
        const ex = converted as SquareUpstreamException;
        expect(ex.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
        expect(ex.message).toContain('500');
        expect(ex.message).toContain('INTERNAL_SERVER_ERROR');
        expect(ex.message).not.toContain('merchant data here');
    });

    it('turns a timeout into a 502', () => {
        expect(
            toSquareAppException(new SquareTimeoutError('timed out')),
        ).toBeInstanceOf(SquareUpstreamException);
    });

    it('passes non-Square errors through unchanged', () => {
        const err = new Error('other');
        expect(toSquareAppException(err)).toBe(err);
    });

    it('callSquare returns the result, or throws the converted error', async () => {
        await expect(callSquare(() => Promise.resolve(42))).resolves.toBe(42);
        await expect(
            callSquare(() => Promise.reject(squareError(401))),
        ).rejects.toBeInstanceOf(SquareReauthRequiredException);
    });
});
