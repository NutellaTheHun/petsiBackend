import { Injectable } from '@nestjs/common';
import { Square } from 'square';
import {
    SquareNotConnectedException,
    SquareReauthRequiredException,
} from '../client/square-error-boundary';
import { SquareLocationImportResultDto } from '../dto/square-location-import-result.dto';
import { SquareConnection } from '../entities/square-connection.entity';
import { SquareLocationLink } from '../entities/square-location-link.entity';
import { isDueTodayOrLater } from '../utils/square-import-window';
import { SquareConnectionService } from './square-connection.service';
import { SquareOrderIngestService } from './square-order-ingest.service';

/** Square's maximum `orders.search` page size. */
const SEARCH_PAGE_SIZE = 1000;

/**
 * How far back the import looks for `COMPLETED` orders. A completed order is
 * almost always past due (picked up or delivered); one completed early but due
 * later was closed recently. Bounding it keeps an import from paging through
 * the merchant's whole order history.
 */
export const SQUARE_IMPORT_COMPLETED_LOOKBACK_DAYS = 30;

const IMPORTED_FULFILLMENTS: Square.SearchOrdersFulfillmentFilter = {
    fulfillmentTypes: ['PICKUP', 'DELIVERY'],
};

/**
 * The searches one import runs: every `OPEN` order (few, and a pre-order
 * placed long ago may still be due), and `COMPLETED` orders closed within the
 * lookback. Square requires sorting by the timestamp a query filters on.
 */
export function importQueries(now: Date): Square.SearchOrdersQuery[] {
    const closedSince = new Date(
        now.getTime() - SQUARE_IMPORT_COMPLETED_LOOKBACK_DAYS * 86_400_000,
    );
    return [
        {
            filter: {
                stateFilter: { states: ['OPEN'] },
                fulfillmentFilter: IMPORTED_FULFILLMENTS,
            },
        },
        {
            filter: {
                stateFilter: { states: ['COMPLETED'] },
                fulfillmentFilter: IMPORTED_FULFILLMENTS,
                dateTimeFilter: {
                    closedAt: { startAt: closedSince.toISOString() },
                },
            },
            sort: { sortField: 'CLOSED_AT', sortOrder: 'DESC' },
        },
    ];
}

/**
 * The initial order import for one location link: search the location's
 * open and recently completed pickup and delivery orders (`importQueries`),
 * keep those due today or later in
 * the link's timezone, and ingest each one as the triggering user. Run when a
 * tenant admin enables a link and by the manual "Re-sync location" action;
 * never from a sync, the OAuth callback or a cron. Idempotent through
 * ingest's dedupe and version checks.
 */
@Injectable()
export class SquareLocationImportService {
    constructor(
        private readonly connectionService: SquareConnectionService,
        private readonly ingest: SquareOrderIngestService,
    ) {}

    /**
     * The tenant's connection, if it can make Square calls. Checked before a
     * link is enabled, so a dead connection fails the request up front.
     */
    async requireConnection(tenantId: number): Promise<SquareConnection> {
        const connection = await this.connectionService.findByTenant(tenantId);
        if (connection?.status === 'needs_reauth') {
            throw new SquareReauthRequiredException();
        }
        if (connection?.status !== 'connected') {
            throw new SquareNotConnectedException();
        }
        return connection;
    }

    /**
     * @param actorUserId the tenant admin who triggered it; recorded as the
     * revision actor on every order written.
     * @param now injectable for specs; the import window is relative to it.
     */
    async importLocation(
        link: SquareLocationLink,
        actorUserId: number | undefined,
        now = new Date(),
    ): Promise<SquareLocationImportResultDto> {
        const connection = await this.requireConnection(link.tenantId);
        const result: SquareLocationImportResultDto = {
            found: 0,
            pastDue: 0,
            created: 0,
            updated: 0,
            unchanged: 0,
            skipped: 0,
            rejected: 0,
        };

        for (const query of importQueries(now)) {
            let cursor: string | undefined;
            do {
                const page = await this.searchPage(
                    connection,
                    link,
                    query,
                    cursor,
                );
                for (const order of page.orders ?? []) {
                    result.found++;
                    if (!isDueTodayOrLater(order, link.timezone, now)) {
                        result.pastDue++;
                        continue;
                    }
                    await this.ingestOne(
                        connection,
                        order,
                        actorUserId,
                        result,
                    );
                }
                cursor = page.cursor || undefined;
            } while (cursor);
        }

        // Task 14: a re-sync also retries the location's open order issues.
        return result;
    }

    private searchPage(
        connection: SquareConnection,
        link: SquareLocationLink,
        query: Square.SearchOrdersQuery,
        cursor: string | undefined,
    ): Promise<Square.SearchOrdersResponse> {
        return this.connectionService.callTenant(connection, (api) =>
            api.orders.search({
                locationIds: [link.squareLocationId],
                cursor,
                limit: SEARCH_PAGE_SIZE,
                query,
            }),
        );
    }

    private async ingestOne(
        connection: SquareConnection,
        order: Square.Order,
        actorUserId: number | undefined,
        result: SquareLocationImportResultDto,
    ): Promise<void> {
        // A rejected order is recorded as an order issue (and retried by the
        // next re-sync); it doesn't stop the import.
        const outcome = await this.ingest.ingest(connection, order, {
            actorUserId,
        });
        if (outcome.outcome === 'stale') {
            result.unchanged++;
        } else {
            result[outcome.outcome]++;
        }
    }
}
