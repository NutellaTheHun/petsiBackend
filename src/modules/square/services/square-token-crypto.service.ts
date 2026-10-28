import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const FORMAT_VERSION = 'v1';

/**
 * Encrypts Square OAuth tokens at rest with AES-256-GCM. The key is
 * `SQUARE_TOKEN_ENCRYPTION_KEY` (base64 of 32 bytes), read on first use so the
 * app still boots where Square isn't configured. Stored form:
 * `v1:<iv>:<auth tag>:<ciphertext>`, each part base64.
 *
 * Errors never include the key, the token or the ciphertext.
 */
@Injectable()
export class SquareTokenCryptoService {
    private key?: Buffer;

    constructor(private readonly config: ConfigService) {}

    encrypt(plaintext: string): string {
        const iv = randomBytes(IV_BYTES);
        const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
        const ciphertext = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        return [
            FORMAT_VERSION,
            iv.toString('base64'),
            cipher.getAuthTag().toString('base64'),
            ciphertext.toString('base64'),
        ].join(':');
    }

    decrypt(stored: string): string {
        const [version, iv, tag, ciphertext] = stored.split(':');
        if (version !== FORMAT_VERSION || !iv || !tag || ciphertext == null) {
            throw new Error('Square token has an unrecognized format');
        }
        const decipher = createDecipheriv(
            ALGORITHM,
            this.getKey(),
            Buffer.from(iv, 'base64'),
        );
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        try {
            return Buffer.concat([
                decipher.update(Buffer.from(ciphertext, 'base64')),
                decipher.final(),
            ]).toString('utf8');
        } catch {
            // Wrong key or tampered value; don't surface crypto internals
            throw new Error('Square token could not be decrypted');
        }
    }

    private getKey(): Buffer {
        if (!this.key) {
            const raw = this.config.get<string>(
                SQUARE_CONFIG_KEYS.TOKEN_ENCRYPTION_KEY,
            );
            const key = raw ? Buffer.from(raw, 'base64') : undefined;
            if (key?.length !== KEY_BYTES) {
                throw new Error(
                    `${SQUARE_CONFIG_KEYS.TOKEN_ENCRYPTION_KEY} must be set to ${KEY_BYTES} base64-encoded bytes`,
                );
            }
            this.key = key;
        }
        return this.key;
    }
}
