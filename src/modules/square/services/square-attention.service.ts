import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    SquareAttentionDto,
    SquareLocationAttentionDto,
} from '../dto/square-attention.dto';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareOrderIssue } from '../entities/square-order-issue.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';

/**
 * The attention queue as data (there are no notifications): per-location
 * pending lines and open issues, limited to the locations whose orders the
 * caller can read (all of them for a tenant admin), plus tenant-wide counts
 * of unmapped and unreviewed links. Deleted and archived links are hidden
 * from the mapping view, so they aren't counted.
 */
@Injectable()
export class SquareAttentionService {
    constructor(
        @InjectRepository(SquareUnresolvedLine)
        private readonly lineRepo: Repository<SquareUnresolvedLine>,
        @InjectRepository(SquareOrderIssue)
        private readonly issueRepo: Repository<SquareOrderIssue>,
        @InjectRepository(SquareVariationLink)
        private readonly variationRepo: Repository<SquareVariationLink>,
        @InjectRepository(SquareModifierLink)
        private readonly modifierRepo: Repository<SquareModifierLink>,
        private readonly requestContextService: RequestContextService,
    ) {}

    async getForCurrentTenant(): Promise<SquareAttentionDto> {
        const tenantId = this.getTenantId();
        const locationIds = this.readableLocationIds();

        const [pendingLines, openIssues] = await Promise.all([
            this.countByLocation(
                this.lineRepo
                    .createQueryBuilder('row')
                    .where('row.tenantId = :tenantId', { tenantId })
                    .andWhere("row.status = 'pending'"),
                locationIds,
            ),
            this.countByLocation(
                this.issueRepo
                    .createQueryBuilder('row')
                    .where('row.tenantId = :tenantId', { tenantId })
                    .andWhere("row.status = 'open'")
                    .andWhere('row.locationId IS NOT NULL'),
                locationIds,
            ),
        ]);
        const locations: SquareLocationAttentionDto[] = [
            ...new Set([...pendingLines.keys(), ...openIssues.keys()]),
        ]
            .sort((a, b) => a - b)
            .map((locationId) => ({
                locationId,
                pendingLines: pendingLines.get(locationId) ?? 0,
                openIssues: openIssues.get(locationId) ?? 0,
            }));

        const liveVariations = () =>
            this.variationRepo
                .createQueryBuilder('link')
                .where('link.tenantId = :tenantId', { tenantId })
                .andWhere('link.isDeleted = false')
                .andWhere('link.isArchived = false');
        const liveModifiers = () =>
            this.modifierRepo
                .createQueryBuilder('link')
                .where('link.tenantId = :tenantId', { tenantId })
                .andWhere('link.isDeleted = false');

        const [
            unmappedVariations,
            unmappedModifiers,
            unreviewedVariations,
            unreviewedModifiers,
        ] = await Promise.all([
            // modifier_is_item takes its products from the modifiers
            liveVariations()
                .andWhere('link.enabled = true')
                .andWhere("link.modifierMode <> 'modifier_is_item'")
                .andWhere(
                    '(link.menuItemId IS NULL OR link.menuItemSizeId IS NULL)',
                )
                .getCount(),
            liveModifiers()
                .andWhere('link.enabled = true')
                .andWhere("link.kind = 'item'")
                .andWhere(
                    '(link.menuItemId IS NULL OR link.menuItemSizeId IS NULL)',
                )
                .getCount(),
            liveVariations().andWhere('link.reviewedAt IS NULL').getCount(),
            liveModifiers().andWhere('link.reviewedAt IS NULL').getCount(),
        ]);

        return {
            locations,
            unmappedLinks: {
                variations: unmappedVariations,
                modifiers: unmappedModifiers,
            },
            unreviewedLinks: {
                variations: unreviewedVariations,
                modifiers: unreviewedModifiers,
            },
        };
    }

    /** Row counts per `locationId`, within `locationIds` unless null. */
    private async countByLocation<T extends object>(
        query: SelectQueryBuilder<T>,
        locationIds: number[] | null,
    ): Promise<Map<number, number>> {
        if (locationIds?.length === 0) {
            return new Map();
        }
        if (locationIds) {
            query.andWhere('row.locationId IN (:...locationIds)', {
                locationIds,
            });
        }
        const rows = await query
            .select('row.locationId', 'locationId')
            .addSelect('COUNT(*)', 'count')
            .groupBy('row.locationId')
            .getRawMany<{ locationId: number; count: string }>();
        return new Map(
            rows.map((row) => [Number(row.locationId), Number(row.count)]),
        );
    }

    /** Null for a tenant admin (every location), else the assigned ones. */
    private readableLocationIds(): number[] | null {
        if (this.requestContextService.get<boolean>('isTenantAdmin') === true) {
            return null;
        }
        return (
            this.requestContextService.get<{ locationId: number }[]>(
                'locations',
            ) ?? []
        ).map((l) => l.locationId);
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
