import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import {
    areModifierSiblings,
    isModifierMapped,
    ModifierMapping,
    pickSiblingSource,
} from '../utils/square-modifier-siblings';

/**
 * Sibling propagation for modifier links: one flavor in a "choose 6" box is a
 * separate modifier in every slot's list, so a mapping applies to every
 * same-named modifier on a list attached to the same Square item (never
 * across items). `manual` siblings are never written; propagated rows stay
 * `derived`.
 */
@Injectable()
export class SquareModifierPropagationService {
    constructor(
        @InjectRepository(SquareModifierLink)
        private readonly modifierRepo: Repository<SquareModifierLink>,
    ) {}

    /**
     * Copies `source`'s mapping (map, ignore or clear) onto its non-manual
     * siblings, stamping `reviewedAt` when given. Returns the ids it changed.
     */
    async propagateFrom(
        source: SquareModifierLink,
        reviewedAt?: Date,
    ): Promise<number[]> {
        const mapping = toMapping(source);
        const changedIds = (
            await this.modifierRepo.find({
                where: { tenantId: source.tenantId, mappingSource: 'derived' },
            })
        )
            .filter(
                (link) =>
                    areModifierSiblings(source, link) &&
                    !sameMapping(link, mapping),
            )
            .map((link) => link.id);
        if (changedIds.length > 0) {
            await this.modifierRepo.update(
                { id: In(changedIds), mappingSource: 'derived' },
                { ...mapping, ...(reviewedAt ? { reviewedAt } : {}) },
            );
        }
        return changedIds;
    }

    /**
     * The sync's half: every unmapped, non-manual, live link with a mapped
     * sibling takes that sibling's mapping (a `manual` one first). Sources
     * are the links mapped before this call, so it never chains across items.
     */
    async fillUnmappedFromSiblings(tenantId: number): Promise<void> {
        const links = await this.modifierRepo.find({ where: { tenantId } });
        for (const link of links) {
            if (
                link.mappingSource === 'manual' ||
                link.isDeleted ||
                isModifierMapped(link)
            ) {
                continue;
            }
            const source = pickSiblingSource(link, links);
            if (source) {
                await this.modifierRepo.update(
                    { id: link.id, mappingSource: 'derived' },
                    toMapping(source),
                );
            }
        }
    }
}

function toMapping(link: ModifierMapping): ModifierMapping {
    return {
        kind: link.kind,
        menuItemId: link.menuItemId,
        menuItemSizeId: link.menuItemSizeId,
    };
}

function sameMapping(a: ModifierMapping, b: ModifierMapping): boolean {
    return (
        a.kind === b.kind &&
        a.menuItemId === b.menuItemId &&
        a.menuItemSizeId === b.menuItemSizeId
    );
}
