import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareClientFactory } from '../client/square-client.factory';
import {
    SquareUpstreamException,
    callSquare,
} from '../client/square-error-boundary';
import { SquareAuthorizeUrlDto } from '../dto/square-authorize-url.dto';
import { SquareConnection } from '../entities/square-connection.entity';
import {
    SQUARE_CONFIG_KEYS,
    SQUARE_OAUTH_SCOPES,
    buildSquareAuthorizeUrl,
} from '../utils/square-config';
import { SquareConnectionService } from './square-connection.service';
import { SquareOAuthStateService } from './square-oauth-state.service';
import { SquarePostConnectService } from './square-post-connect.service';
import { SquareTokenCryptoService } from './square-token-crypto.service';

/** The default order category pre-selected on connect, matched case-insensitively. */
export const SQUARE_DEFAULT_CATEGORY_NAME = 'Square';

/**
 * What the callback tells the frontend, as `?square=<outcome>` on the
 * settings URL. Only `connected` stores anything.
 */
export const SQUARE_OAUTH_OUTCOMES = [
    'connected',
    'declined',
    'invalid_state',
    'merchant_in_use',
    'invalid_request',
] as const;

export type SquareOAuthOutcome = (typeof SQUARE_OAUTH_OUTCOMES)[number];

export interface SquareOAuthCallbackQuery {
    code?: string;
    state?: string;
    error?: string;
}

/** Square's OAuth code flow: start (authorize URL) and callback (token exchange). */
@Injectable()
export class SquareOAuthService {
    constructor(
        @InjectRepository(SquareConnection)
        private readonly connectionRepo: Repository<SquareConnection>,
        @InjectRepository(OrderCategory)
        private readonly categoryRepo: Repository<OrderCategory>,
        private readonly connectionService: SquareConnectionService,
        private readonly stateService: SquareOAuthStateService,
        private readonly postConnect: SquarePostConnectService,
        private readonly clientFactory: SquareClientFactory,
        private readonly tokenCrypto: SquareTokenCryptoService,
        private readonly requestContextService: RequestContextService,
        private readonly config: ConfigService,
    ) {}

    /** The authorize URL for the caller's tenant, with a fresh single-use state. */
    async startForCurrentTenant(): Promise<SquareAuthorizeUrlDto> {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        const userId = this.requestContextService.get<number>('userId') ?? null;
        const state = await this.stateService.issue(tenantId, userId);
        return {
            authorizeUrl: buildSquareAuthorizeUrl(
                this.config.get<string>('NODE_ENV'),
                this.config.getOrThrow<string>(
                    SQUARE_CONFIG_KEYS.APPLICATION_ID,
                ),
                state,
            ),
        };
    }

    /**
     * Handles Square's redirect. The tenant comes only from the verified state.
     * Stores a `connected` connection and runs the post-connect syncs; never
     * imports orders. Square failures propagate (the global filter logs them).
     */
    async handleCallback(
        query: SquareOAuthCallbackQuery,
    ): Promise<SquareOAuthOutcome> {
        if (query.error) {
            if (query.state) {
                // Burn the nonce so the state can't be reused
                await this.stateService.consume(query.state);
            }
            return 'declined';
        }
        if (!query.state) {
            return 'invalid_state';
        }
        const verified = await this.stateService.consume(query.state);
        if (!verified) {
            return 'invalid_state';
        }
        if (!query.code) {
            return 'invalid_request';
        }
        const { tenantId } = verified;

        const token = await callSquare(() =>
            this.clientFactory.forApp().oAuth.obtainToken({
                clientId: this.config.getOrThrow<string>(
                    SQUARE_CONFIG_KEYS.APPLICATION_ID,
                ),
                clientSecret: this.config.getOrThrow<string>(
                    SQUARE_CONFIG_KEYS.APPLICATION_SECRET,
                ),
                code: query.code,
                redirectUri: this.config.getOrThrow<string>(
                    SQUARE_CONFIG_KEYS.OAUTH_REDIRECT_URL,
                ),
                grantType: 'authorization_code',
            }),
        );
        if (!token.accessToken || !token.refreshToken || !token.merchantId) {
            throw new SquareUpstreamException('incomplete token response');
        }

        const owner = await this.connectionService.findByMerchant(
            token.merchantId,
        );
        if (owner && owner.tenantId !== tenantId) {
            // Don't revoke: that would cut off the other tenant's access too
            return 'merchant_in_use';
        }

        const existing = await this.connectionService.findByTenant(tenantId);
        const connection = existing ?? this.connectionRepo.create({ tenantId });
        connection.merchantId = token.merchantId;
        connection.accessToken = this.tokenCrypto.encrypt(token.accessToken);
        connection.refreshToken = this.tokenCrypto.encrypt(token.refreshToken);
        connection.accessTokenExpiresAt = token.expiresAt
            ? new Date(token.expiresAt)
            : null;
        connection.scopes = [...SQUARE_OAUTH_SCOPES];
        connection.status = 'connected';
        if (connection.defaultOrderCategoryId == null) {
            connection.defaultOrderCategoryId =
                await this.findDefaultCategoryId(tenantId);
        }

        const { merchant } = await this.connectionService.callTenant(
            connection,
            (api) => api.merchants.get({ merchantId: 'me' }),
        );
        connection.businessName = merchant?.businessName ?? null;

        const saved = await this.connectionRepo.save(connection);
        await this.postConnect.run(saved);
        return 'connected';
    }

    /** The settings URL with the outcome appended, for the browser redirect. */
    settingsRedirectUrl(outcome: SquareOAuthOutcome): string {
        const url = new URL(
            this.config.getOrThrow<string>(SQUARE_CONFIG_KEYS.SETTINGS_URL),
        );
        url.searchParams.set('square', outcome);
        return url.toString();
    }

    /** The tenant's "Square" category, if exactly one matches. Never creates one. */
    private async findDefaultCategoryId(
        tenantId: number,
    ): Promise<number | null> {
        const matches = await this.categoryRepo
            .createQueryBuilder('category')
            .where('category.tenantId = :tenantId', { tenantId })
            .andWhere('LOWER(category.name) = LOWER(:name)', {
                name: SQUARE_DEFAULT_CATEGORY_NAME,
            })
            .getMany();
        return matches.length === 1 ? matches[0].id : null;
    }
}
