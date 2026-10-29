import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { ValidationException } from '../../../common/validation/validation-exception';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    MapSquareAdHocLineDto,
    SquareUnmappedModifierDto,
    SquareUnresolvedLineDto,
    SquareUnresolvedLineGroupDto,
} from '../dto/square-unresolved-line.dto';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { SquareUnresolvedLine } from '../entities/square-unresolved-line.entity';
import { SquareVariationLink } from '../entities/square-variation-link.entity';
import { SquareLineConversionService } from './square-line-conversion.service';

/**
 * The resolution screen's actions on one Petsi location's unresolved lines:
 * list (grouped), map an ad-hoc line, dismiss, retry, disable the variation.
 * `RoleGuard` authorizes the caller for the route's `locationId`; every
 * method then scopes to the caller's tenant and that location, so a line
 * elsewhere is a 404. Mapping a variation or modifier is done through the
 * catalog-mapping routes, which convert these lines too.
 */
@Injectable()
export class SquareUnresolvedLineService {
    constructor(
        @InjectRepository(SquareUnresolvedLine)
        private readonly lineRepo: Repository<SquareUnresolvedLine>,
        @InjectRepository(SquareVariationLink)
        private readonly variationRepo: Repository<SquareVariationLink>,
        @InjectRepository(SquareModifierLink)
        private readonly modifierRepo: Repository<SquareModifierLink>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
        private readonly lineConversion: SquareLineConversionService,
        private readonly requestContextService: RequestContextService,
    ) {}

    /**
     * Pending lines, grouped by what fixes them: a Square variation and
     * reason, or (ad-hoc lines) one group per line. Oldest first.
     */
    async findGroupsForCurrentTenant(
        locationId: number,
    ): Promise<SquareUnresolvedLineGroupDto[]> {
        const tenantId = this.getTenantId();
        const lines = await this.lineRepo.find({
            where: { tenantId, locationId, status: 'pending' },
            order: { id: 'ASC' },
        });
        const variationIds = [
            ...new Set(
                lines
                    .map((line) => line.squareVariationId)
                    .filter((id): id is string => id != null),
            ),
        ];
        const variationLinkIds = new Map(
            (variationIds.length
                ? await this.variationRepo.find({
                      where: { tenantId, squareVariationId: In(variationIds) },
                      select: { id: true, squareVariationId: true },
                  })
                : []
            ).map((link) => [link.squareVariationId, link.id]),
        );
        const modifierIds = [
            ...new Set(
                lines
                    .filter((line) => line.reason === 'unmapped_modifier')
                    .flatMap((line) => line.squareModifiers)
                    .map((m) => m.squareModifierId)
                    .filter((id): id is string => id != null),
            ),
        ];
        const modifierLinks = new Map(
            (modifierIds.length
                ? await this.modifierRepo.find({
                      where: { tenantId, squareModifierId: In(modifierIds) },
                  })
                : []
            ).map((link) => [link.squareModifierId, link]),
        );

        const groups = new Map<string, SquareUnresolvedLineGroupDto>();
        for (const line of lines) {
            const key =
                line.squareVariationId == null
                    ? `${line.reason}:${line.id}`
                    : `${line.reason}:${line.squareVariationId}`;
            let group = groups.get(key);
            if (!group) {
                group = {
                    key,
                    reason: line.reason,
                    squareVariationId: line.squareVariationId,
                    squareItemName: line.squareItemName,
                    squareVariationName: line.squareVariationName,
                    variationLinkId:
                        line.squareVariationId != null
                            ? (variationLinkIds.get(line.squareVariationId) ??
                              null)
                            : null,
                    unmappedModifiers: [],
                    lines: [],
                };
                groups.set(key, group);
            }
            group.lines.push(toLineDto(line));
            if (line.reason === 'unmapped_modifier') {
                addUnmappedModifiers(group, line, modifierLinks);
            }
        }
        return [...groups.values()];
    }

    /**
     * Maps one ad-hoc line to a menu item and size, then converts it. On a
     * frozen order it stays pending (with the mapping) until unfrozen.
     */
    async mapAdHocForCurrentTenant(
        locationId: number,
        id: number,
        dto: MapSquareAdHocLineDto,
    ): Promise<SquareUnresolvedLineDto> {
        const line = await this.findLineOrThrow(locationId, id);
        const errorMap = new ValidationErrorMap(line.id);
        if (line.status !== 'pending') {
            errorMap.addError('INCONSISTENT_STATE', undefined, ['status']);
        }
        if (line.reason !== 'ad_hoc') {
            errorMap.addError('INCONSISTENT_STATE', undefined, ['reason']);
        }
        const menuItem = await this.menuItemRepo.findOne({
            where: { id: dto.menuItemId, tenantId: line.tenantId },
            relations: { sizes: true },
        });
        if (!menuItem) {
            errorMap.addError(
                'REFERENCE_NOT_FOUND',
                undefined,
                ['menuItemId'],
                {
                    value: dto.menuItemId,
                },
            );
        } else {
            if (!menuItem.sizes.some((s) => s.id === dto.menuItemSizeId)) {
                errorMap.addError(
                    'INVALID_REFERENCE',
                    undefined,
                    ['menuItemSizeId'],
                    { value: dto.menuItemSizeId },
                );
            }
            // A variable box needs chosen contents, which an ad-hoc line lacks
            if (menuItem.variableMaxAmount != null) {
                errorMap.addError(
                    'INVALID_REFERENCE',
                    undefined,
                    ['menuItemId'],
                    { value: dto.menuItemId },
                );
            }
        }
        if (!errorMap.isEmpty()) {
            throw new ValidationException(errorMap);
        }

        await this.lineRepo.update(
            { id: line.id },
            {
                adHocMenuItemId: dto.menuItemId,
                adHocMenuItemSizeId: dto.menuItemSizeId,
            },
        );
        await this.lineConversion.convertLines(line.tenantId, [line.id]);
        return this.reload(line.id);
    }

    /** Staff have dealt with it outside Petsi. Dismissing twice is a no-op. */
    async dismissForCurrentTenant(
        locationId: number,
        id: number,
    ): Promise<SquareUnresolvedLineDto> {
        const line = await this.findLineOrThrow(locationId, id);
        if (line.status === 'resolved') {
            const errorMap = new ValidationErrorMap(line.id);
            errorMap.addError('INCONSISTENT_STATE', undefined, ['status']);
            throw new ValidationException(errorMap);
        }
        await this.lineRepo.update({ id: line.id }, { status: 'dismissed' });
        return this.reload(line.id);
    }

    /**
     * Re-runs the line with the current links and menu (e.g. after allowing
     * a flavor in a box). It stays pending if it still can't be placed.
     */
    async retryForCurrentTenant(
        locationId: number,
        id: number,
    ): Promise<SquareUnresolvedLineDto> {
        const line = await this.findLineOrThrow(locationId, id);
        this.enforcePending(line);
        await this.lineConversion.convertLines(line.tenantId, [line.id]);
        return this.reload(line.id);
    }

    /**
     * Disables the line's variation link (a manual, reviewed override):
     * future lines for it are skipped, and its pending lines at every
     * location are dismissed.
     */
    async disableVariationForCurrentTenant(
        locationId: number,
        id: number,
    ): Promise<SquareUnresolvedLineDto> {
        const line = await this.findLineOrThrow(locationId, id);
        this.enforcePending(line);
        const link =
            line.squareVariationId != null
                ? await this.variationRepo.findOne({
                      where: {
                          tenantId: line.tenantId,
                          squareVariationId: line.squareVariationId,
                      },
                  })
                : null;
        if (!link) {
            // Ad-hoc, or a variation no catalog sync has seen: nothing to disable
            const errorMap = new ValidationErrorMap(line.id);
            errorMap.addError('INCONSISTENT_STATE', undefined, [
                'squareVariationId',
            ]);
            throw new ValidationException(errorMap);
        }
        await this.variationRepo.update(
            { id: link.id },
            { enabled: false, mappingSource: 'manual', reviewedAt: new Date() },
        );
        await this.lineConversion.dismissPendingForVariation(
            line.tenantId,
            link.squareVariationId,
        );
        return this.reload(line.id);
    }

    private enforcePending(line: SquareUnresolvedLine): void {
        if (line.status !== 'pending') {
            const errorMap = new ValidationErrorMap(line.id);
            errorMap.addError('INCONSISTENT_STATE', undefined, ['status']);
            throw new ValidationException(errorMap);
        }
    }

    private async reload(id: number): Promise<SquareUnresolvedLineDto> {
        return toLineDto(await this.lineRepo.findOneByOrFail({ id }));
    }

    private async findLineOrThrow(
        locationId: number,
        id: number,
    ): Promise<SquareUnresolvedLine> {
        const line = await this.lineRepo.findOne({
            where: { id, tenantId: this.getTenantId(), locationId },
        });
        if (!line) {
            throw new NotFoundException();
        }
        return line;
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

/**
 * Adds the line's modifiers that still block it (no link, or an enabled
 * `item` link without a mapping) to the group, once each.
 */
function addUnmappedModifiers(
    group: SquareUnresolvedLineGroupDto,
    line: SquareUnresolvedLine,
    links: ReadonlyMap<string, SquareModifierLink>,
): void {
    for (const modifier of line.squareModifiers) {
        const link =
            modifier.squareModifierId != null
                ? links.get(modifier.squareModifierId)
                : undefined;
        const blocks =
            !link ||
            (link.enabled &&
                link.kind === 'item' &&
                (link.menuItemId == null || link.menuItemSizeId == null));
        const seen = group.unmappedModifiers.some(
            (m: SquareUnmappedModifierDto) =>
                m.squareModifierId === modifier.squareModifierId &&
                m.name === modifier.name,
        );
        if (blocks && !seen) {
            group.unmappedModifiers.push({
                squareModifierId: modifier.squareModifierId,
                name: modifier.name,
                modifierLinkId: link?.id ?? null,
            });
        }
    }
}

function toLineDto(line: SquareUnresolvedLine): SquareUnresolvedLineDto {
    return {
        id: line.id,
        orderId: line.orderId,
        squareOrderId: line.squareOrderId,
        squareLineUid: line.squareLineUid,
        squareVariationId: line.squareVariationId,
        squareItemName: line.squareItemName,
        squareVariationName: line.squareVariationName,
        squareModifiers: line.squareModifiers,
        reason: line.reason,
        quantity: line.quantity,
        note: line.note,
        status: line.status,
        adHocMenuItemId: line.adHocMenuItemId,
        adHocMenuItemSizeId: line.adHocMenuItemSizeId,
        createdAt: line.createdAt,
    };
}
