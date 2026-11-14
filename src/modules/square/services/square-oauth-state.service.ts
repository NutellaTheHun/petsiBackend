import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes } from 'crypto';
import { LessThan, Repository } from 'typeorm';
import { SquareOAuthState } from '../entities/square-oauth-state.entity';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';

/** How long the tenant has to finish authorizing on Square. */
export const SQUARE_OAUTH_STATE_TTL_SECONDS = 600;

const STATE_AUDIENCE = 'square-oauth-state';

interface StatePayload {
    tid: number;
    uid: number | null;
    nonce: string;
}

export interface VerifiedOAuthState {
    tenantId: number;
    userId: number | null;
}

/**
 * Issues and consumes the OAuth `state`: a short-lived JWT holding tenant,
 * user and nonce, the only thing tying Square's browser redirect to a tenant.
 *
 * Signed with a key derived from the Square application secret, not
 * `JWT_SECRET`, so a state can never pass `AuthGuard` as an access token.
 * Single use: the nonce is stored on issue and deleted on consume.
 */
@Injectable()
export class SquareOAuthStateService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        @InjectRepository(SquareOAuthState)
        private readonly stateRepo: Repository<SquareOAuthState>,
    ) {}

    /** `ttlSeconds` is overridable so specs can issue an expired state. */
    async issue(
        tenantId: number,
        userId: number | null,
        ttlSeconds = SQUARE_OAUTH_STATE_TTL_SECONDS,
    ): Promise<string> {
        await this.stateRepo.delete({ expiresAt: LessThan(new Date()) });

        const nonce = randomBytes(16).toString('base64url');
        await this.stateRepo.insert({
            nonce,
            tenantId,
            expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        });
        const payload: StatePayload = { tid: tenantId, uid: userId, nonce };
        return this.jwtService.signAsync(payload, {
            secret: this.getSecret(),
            audience: STATE_AUDIENCE,
            expiresIn: ttlSeconds,
        });
    }

    /**
     * Verifies signature and expiry, then consumes the nonce. Returns null for
     * an invalid, expired or already-used state.
     */
    async consume(state: string): Promise<VerifiedOAuthState | null> {
        let payload: StatePayload;
        try {
            payload = await this.jwtService.verifyAsync<StatePayload>(state, {
                secret: this.getSecret(),
                audience: STATE_AUDIENCE,
            });
        } catch {
            return null;
        }
        if (
            typeof payload.nonce !== 'string' ||
            !Number.isInteger(payload.tid)
        ) {
            return null;
        }
        const { affected } = await this.stateRepo.delete({
            nonce: payload.nonce,
            tenantId: payload.tid,
        });
        if (!affected) {
            return null;
        }
        return { tenantId: payload.tid, userId: payload.uid ?? null };
    }

    private getSecret(): string {
        const appSecret = this.config.get<string>(
            SQUARE_CONFIG_KEYS.APPLICATION_SECRET,
        );
        if (!appSecret) {
            throw new Error(
                `${SQUARE_CONFIG_KEYS.APPLICATION_SECRET} must be set`,
            );
        }
        return createHmac('sha256', appSecret)
            .update(STATE_AUDIENCE)
            .digest('base64');
    }
}
