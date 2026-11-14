import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { SquareError } from 'square';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { SquareClientFactory } from '../client/square-client.factory';
import {
    SquareUpstreamException,
    toSquareAppException,
} from '../client/square-error-boundary';
import { SquareConnection } from '../entities/square-connection.entity';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';
import { SquareConnectionService } from './square-connection.service';
import { SquareTokenCryptoService } from './square-token-crypto.service';

/** Access tokens expiring within this window are refreshed. */
export const SQUARE_REFRESH_WINDOW_DAYS = 7;

/** Tenant ids per outcome of one refresh run. */
export interface SquareTokenRefreshResult {
    refreshed: number[];
    needsReauth: number[];
    /** Transient failures, left `connected` for the next daily run. */
    failed: number[];
}

/**
 * Keeps OAuth access tokens (30-day lifetime) valid. Code-flow refresh tokens
 * don't expire until access is revoked, so a rejected refresh means the
 * tenant has to reconnect.
 */
@Injectable()
export class SquareTokenRefreshService {
    constructor(
        @InjectRepository(SquareConnection)
        private readonly connectionRepo: Repository<SquareConnection>,
        private readonly connectionService: SquareConnectionService,
        private readonly clientFactory: SquareClientFactory,
        private readonly tokenCrypto: SquareTokenCryptoService,
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_4AM)
    async handleCron(): Promise<void> {
        await this.refreshExpiring();
    }

    /**
     * Refreshes every `connected` connection whose access token expires
     * within `SQUARE_REFRESH_WINDOW_DAYS` of `now` (or has no known expiry).
     * Each connection is handled on its own, so one failure doesn't stop the
     * others. No retries: the next daily run is the retry.
     */
    async refreshExpiring(
        now: Date = new Date(),
    ): Promise<SquareTokenRefreshResult> {
        const cutoff = new Date(
            now.getTime() + SQUARE_REFRESH_WINDOW_DAYS * 86_400_000,
        );
        const connections = await this.connectionRepo.find({
            where: [
                {
                    status: 'connected',
                    accessTokenExpiresAt: LessThanOrEqual(cutoff),
                },
                { status: 'connected', accessTokenExpiresAt: IsNull() },
            ],
        });

        const result: SquareTokenRefreshResult = {
            refreshed: [],
            needsReauth: [],
            failed: [],
        };
        for (const connection of connections) {
            try {
                await this.refresh(connection);
                result.refreshed.push(connection.tenantId);
            } catch (err) {
                if (isRejectedGrant(err)) {
                    await this.connectionService.markNeedsReauth(connection);
                    result.needsReauth.push(connection.tenantId);
                    continue;
                }
                result.failed.push(connection.tenantId);
                // No request, so the global filter never sees this. The
                // converted message carries only status and Square error codes.
                const converted = toSquareAppException(err);
                this.logger.warn(
                    { tenantId: connection.tenantId },
                    `Square token refresh failed: ${
                        converted instanceof Error
                            ? converted.message
                            : 'unknown error'
                    }`,
                );
            }
        }
        return result;
    }

    private async refresh(connection: SquareConnection): Promise<void> {
        if (!connection.refreshToken) {
            throw new SquareUpstreamException('no stored refresh token');
        }
        const token = await this.clientFactory.forApp().oAuth.obtainToken({
            clientId: this.config.getOrThrow<string>(
                SQUARE_CONFIG_KEYS.APPLICATION_ID,
            ),
            clientSecret: this.config.getOrThrow<string>(
                SQUARE_CONFIG_KEYS.APPLICATION_SECRET,
            ),
            refreshToken: this.tokenCrypto.decrypt(connection.refreshToken),
            grantType: 'refresh_token',
        });
        if (!token.accessToken) {
            throw new SquareUpstreamException('incomplete token response');
        }
        // Conditional on `connected`, so a disconnect during the run isn't
        // undone by writing tokens back
        await this.connectionRepo.update(
            { id: connection.id, status: 'connected' },
            {
                accessToken: this.tokenCrypto.encrypt(token.accessToken),
                accessTokenExpiresAt: token.expiresAt
                    ? new Date(token.expiresAt)
                    : null,
                ...(token.refreshToken
                    ? {
                          refreshToken: this.tokenCrypto.encrypt(
                              token.refreshToken,
                          ),
                      }
                    : {}),
            },
        );
    }
}

/** Square refused the refresh token itself: 401, or 400 `invalid_grant`. */
function isRejectedGrant(err: unknown): boolean {
    if (!(err instanceof SquareError)) {
        return false;
    }
    if (err.statusCode === HttpStatus.UNAUTHORIZED) {
        return true;
    }
    return (
        err.statusCode === HttpStatus.BAD_REQUEST &&
        err.errors.some((e) => e.code.toLowerCase() === 'invalid_grant')
    );
}
