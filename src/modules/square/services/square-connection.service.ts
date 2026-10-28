import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { OrderCategory } from '../../orders/entities/order-category.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { SquareClientFactory } from '../client/square-client.factory';
import {
    SquareNotConnectedException,
    SquareReauthRequiredException,
    callSquare,
} from '../client/square-error-boundary';
import { SquareConnectionStatusDto } from '../dto/square-connection-status.dto';
import { SquareConnection } from '../entities/square-connection.entity';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';

/**
 * Reads and writes the tenant's `SquareConnection`. Not a `ServiceBase`: the
 * connection is written by the OAuth flow and read on the webhook path (no
 * request context), never through generic CRUD, so methods that can run
 * without a request take the tenant id explicitly.
 */
@Injectable()
export class SquareConnectionService {
    constructor(
        @InjectRepository(SquareConnection)
        private readonly connectionRepo: Repository<SquareConnection>,
        @InjectRepository(OrderCategory)
        private readonly categoryRepo: Repository<OrderCategory>,
        private readonly requestContextService: RequestContextService,
        private readonly clientFactory: SquareClientFactory,
        private readonly config: ConfigService,
    ) {}

    async findByTenant(tenantId: number): Promise<SquareConnection | null> {
        return this.connectionRepo.findOne({ where: { tenantId } });
    }

    async findByMerchant(merchantId: string): Promise<SquareConnection | null> {
        return this.connectionRepo.findOne({ where: { merchantId } });
    }

    async getStatusForCurrentTenant(): Promise<SquareConnectionStatusDto> {
        return toStatusDto(await this.findByTenant(this.getTenantId()));
    }

    /**
     * Revokes Petsi's access with Square, then marks the connection
     * `disconnected`. Idempotent for an already-disconnected connection.
     */
    async disconnectForCurrentTenant(): Promise<SquareConnectionStatusDto> {
        const connection = await this.findByTenant(this.getTenantId());
        if (!connection) {
            throw new SquareNotConnectedException();
        }
        if (connection.status !== 'disconnected') {
            await this.revoke(connection.merchantId);
            await this.markDisconnected(connection.tenantId);
        }
        return toStatusDto(await this.findByTenant(connection.tenantId));
    }

    /**
     * Sets `disconnected` and wipes the stored tokens. Link tables are kept, so
     * reconnecting restores the mappings. No Square call: the revocation
     * webhook (access already revoked on Square's side) calls this directly.
     */
    async markDisconnected(tenantId: number): Promise<void> {
        await this.connectionRepo.update(
            { tenantId },
            {
                status: 'disconnected',
                accessToken: null,
                refreshToken: null,
                accessTokenExpiresAt: null,
            },
        );
    }

    /** `null` clears it. The category must belong to the caller's tenant. */
    async setDefaultOrderCategoryForCurrentTenant(
        orderCategoryId: number | null,
    ): Promise<SquareConnectionStatusDto> {
        const tenantId = this.getTenantId();
        const connection = await this.findByTenant(tenantId);
        if (!connection) {
            throw new SquareNotConnectedException();
        }
        if (orderCategoryId != null) {
            const category = await this.categoryRepo.findOne({
                where: { id: orderCategoryId, tenantId },
            });
            if (!category) {
                const errorMap = new ValidationErrorMap(connection.id);
                errorMap.addError(
                    'REFERENCE_NOT_FOUND',
                    undefined,
                    ['orderCategoryId'],
                    { value: orderCategoryId },
                );
                throw new ValidationException(errorMap);
            }
        }
        await this.connectionRepo.update(
            { id: connection.id },
            { defaultOrderCategoryId: orderCategoryId },
        );
        return toStatusDto(await this.findByTenant(tenantId));
    }

    /**
     * Revokes every token the merchant granted Petsi. A 401 means access is
     * already gone, which is the outcome we want.
     */
    private async revoke(merchantId: string): Promise<void> {
        const clientId = this.config.getOrThrow<string>(
            SQUARE_CONFIG_KEYS.APPLICATION_ID,
        );
        const secret = this.config.getOrThrow<string>(
            SQUARE_CONFIG_KEYS.APPLICATION_SECRET,
        );
        try {
            await callSquare(() =>
                this.clientFactory
                    .forApp()
                    .oAuth.revokeToken(
                        { clientId, merchantId },
                        { headers: { Authorization: `Client ${secret}` } },
                    ),
            );
        } catch (err) {
            if (!(err instanceof SquareReauthRequiredException)) {
                throw err;
            }
        }
    }

    /** The caller's tenant, from the request context; never a client-supplied id. */
    private getTenantId(): number {
        const tenantId = this.requestContextService.get<number>('tenantId');
        if (tenantId == null) {
            throw new NotFoundException();
        }
        return tenantId;
    }
}

function toStatusDto(
    connection: SquareConnection | null,
): SquareConnectionStatusDto {
    if (!connection) {
        return {
            status: 'not_connected',
            businessName: null,
            defaultOrderCategoryId: null,
        };
    }
    return {
        status: connection.status,
        businessName: connection.businessName,
        defaultOrderCategoryId: connection.defaultOrderCategoryId,
    };
}
