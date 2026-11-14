import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';
import { SquareTokenCryptoService } from './square-token-crypto.service';

function serviceWithKey(key: string | undefined): SquareTokenCryptoService {
    return new SquareTokenCryptoService(
        new ConfigService({ [SQUARE_CONFIG_KEYS.TOKEN_ENCRYPTION_KEY]: key }),
    );
}

describe('SquareTokenCryptoService', () => {
    const key = randomBytes(32).toString('base64');

    it('round-trips a token and never stores the plaintext', () => {
        const service = serviceWithKey(key);
        const stored = service.encrypt('EAAA-secret-token');

        expect(stored).not.toContain('EAAA-secret-token');
        expect(service.decrypt(stored)).toBe('EAAA-secret-token');
    });

    it('uses a fresh IV, so the same token encrypts differently each time', () => {
        const service = serviceWithKey(key);
        expect(service.encrypt('same')).not.toBe(service.encrypt('same'));
    });

    it('rejects a value encrypted under another key', () => {
        const stored = serviceWithKey(key).encrypt('token');
        const other = serviceWithKey(randomBytes(32).toString('base64'));
        expect(() => other.decrypt(stored)).toThrow('could not be decrypted');
    });

    it('rejects a tampered value', () => {
        const service = serviceWithKey(key);
        const [v, iv, tag, ct] = service.encrypt('token').split(':');
        const flipped = Buffer.from(ct, 'base64');
        flipped[0] ^= 1;
        expect(() =>
            service.decrypt([v, iv, tag, flipped.toString('base64')].join(':')),
        ).toThrow('could not be decrypted');
    });

    it('refuses to run without a 32-byte key, without echoing the key', () => {
        expect(() => serviceWithKey(undefined).encrypt('t')).toThrow(
            SQUARE_CONFIG_KEYS.TOKEN_ENCRYPTION_KEY,
        );
        const short = Buffer.from('short').toString('base64');
        let message = '';
        try {
            serviceWithKey(short).encrypt('t');
        } catch (err) {
            message = (err as Error).message;
        }
        expect(message).toContain('32 base64-encoded bytes');
        expect(message).not.toContain(short);
    });
});
