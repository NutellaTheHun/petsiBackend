import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WebhooksHelper } from 'square';
import { Repository } from 'typeorm';
import { TenantFeatureService } from '../../feature-flags/services/tenant-feature.service';
import { FEATURE_REGISTRY } from '../../feature-flags/utils/feature.registry';
import {
    SquareNotConnectedException,
    SquareNotFoundException,
    SquareReauthRequiredException,
} from '../client/square-error-boundary';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareOrderLink } from '../entities/square-order-link.entity';
import { SquareWebhookReceipt } from '../entities/square-webhook-receipt.entity';
import { SQUARE_CONFIG_KEYS } from '../utils/square-config';
import {
    SquareWebhookEvent,
    parseSquareWebhookEvent,
} from '../utils/square-webhook-event';
import { SquareCatalogSyncService } from './square-catalog-sync.service';
import { SquareConnectionService } from './square-connection.service';
import { SquareOrderIngestService } from './square-order-ingest.service';

export type SquareWebhookOutcome =
    | 'processed'
    | 'duplicate'
    | 'stale'
    | 'rejected'
    | 'unprocessable'
    | 'dropped';

/**
 * Handles the app-level webhook subscription. The signature is the only auth:
 * it's checked over the raw body before anything is parsed. The tenant then
 * comes from the event's `merchant_id`. Everything after verification is
 * acknowledged (Square retries anything else), except an unexpected failure,
 * which is rethrown so Square redelivers it. Never logs bodies or keys.
 */
@Injectable()
export class SquareWebhookService {
    constructor(
        @InjectRepository(SquareWebhookReceipt)
        private readonly receiptRepo: Repository<SquareWebhookReceipt>,
        @InjectRepository(SquareOrderLink)
        private readonly orderLinkRepo: Repository<SquareOrderLink>,
        private readonly connectionService: SquareConnectionService,
        private readonly catalogSync: SquareCatalogSyncService,
        private readonly ingest: SquareOrderIngestService,
        private readonly tenantFeatures: TenantFeatureService,
        private readonly config: ConfigService,
    ) {}

    /** Throws `ForbiddenException` (403) when the signature doesn't match. */
    async handle(
        rawBody: Buffer | undefined,
        signature: string | undefined,
    ): Promise<SquareWebhookOutcome> {
        const body = rawBody?.toString('utf8');
        if (!body || !signature || !(await this.verify(body, signature))) {
            throw new ForbiddenException();
        }

        const event = parseSquareWebhookEvent(parseJson(body));
        if (!event) {
            return 'dropped';
        }
        const connection = await this.connectionService.findByMerchant(
            event.merchantId,
        );
        if (!connection) {
            return 'dropped';
        }
        // Revocation is honoured whatever the connection's state or flag
        if (event.kind === 'revoked') {
            if (connection.status !== 'disconnected') {
                await this.connectionService.markDisconnected(
                    connection.tenantId,
                );
            }
            return 'processed';
        }
        if (
            event.kind === 'ignored' ||
            connection.status !== 'connected' ||
            !(await this.hasFeature(connection.tenantId))
        ) {
            return 'dropped';
        }

        if (!(await this.claim(event, connection.tenantId))) {
            return 'duplicate';
        }
        try {
            return await this.process(event, connection);
        } catch (err) {
            if (
                err instanceof SquareReauthRequiredException ||
                err instanceof SquareNotConnectedException ||
                err instanceof SquareNotFoundException
            ) {
                // Redelivery can't help (the 401 already set needs_reauth);
                // a re-sync after reconnecting recovers the change.
                return 'unprocessable';
            }
            // Let Square redeliver it
            await this.receiptRepo.delete({ eventId: event.eventId });
            throw err;
        }
    }

    private async process(
        event: Exclude<SquareWebhookEvent, { kind: 'revoked' | 'ignored' }>,
        connection: SquareConnection,
    ): Promise<SquareWebhookOutcome> {
        if (event.kind === 'catalog') {
            await this.catalogSync.syncSince(
                connection,
                connection.catalogSyncedAt ?? undefined,
            );
            return 'processed';
        }

        if (event.version != null) {
            const link = await this.orderLinkRepo.findOne({
                where: {
                    tenantId: connection.tenantId,
                    squareOrderId: event.orderId,
                },
            });
            if (link && BigInt(link.squareVersion) >= BigInt(event.version)) {
                return 'stale';
            }
        }
        const { order } = await this.connectionService.callTenant(
            connection,
            (api) => api.orders.get({ orderId: event.orderId }),
        );
        if (!order) {
            return 'unprocessable';
        }
        // A rejected order is recorded as an order issue and still acknowledged
        const result = await this.ingest.ingest(connection, order);
        if (result.outcome === 'stale' || result.outcome === 'rejected') {
            return result.outcome;
        }
        return 'processed';
    }

    private verify(body: string, signature: string): Promise<boolean> {
        return WebhooksHelper.verifySignature({
            requestBody: body,
            signatureHeader: signature,
            signatureKey: this.config.getOrThrow<string>(
                SQUARE_CONFIG_KEYS.WEBHOOK_SIGNATURE_KEY,
            ),
            notificationUrl: this.config.getOrThrow<string>(
                SQUARE_CONFIG_KEYS.WEBHOOK_NOTIFICATION_URL,
            ),
        });
    }

    private async hasFeature(tenantId: number): Promise<boolean> {
        const features =
            await this.tenantFeatures.findEnabledFeatures(tenantId);
        return features.includes(FEATURE_REGISTRY.SQUARE_INTEGRATION);
    }

    /** Records the event id; `false` when it was already processed. */
    private async claim(
        event: SquareWebhookEvent,
        tenantId: number,
    ): Promise<boolean> {
        const result = await this.receiptRepo
            .createQueryBuilder()
            .insert()
            .values({
                eventId: event.eventId,
                tenantId,
                type: event.type,
            })
            .orIgnore()
            .returning('"eventId"')
            .execute();
        return (result.raw as unknown[]).length > 0;
    }
}

function parseJson(body: string): unknown {
    try {
        return JSON.parse(body) as unknown;
    } catch {
        return undefined;
    }
}
