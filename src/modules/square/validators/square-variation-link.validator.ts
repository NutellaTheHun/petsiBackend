import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import {
    SquareModifierMode,
    SquareVariationLink,
} from '../entities/square-variation-link.entity';

/** A variation link's mapping as it would be saved. */
export interface SquareVariationMapping {
    menuItemId: number | null;
    menuItemSizeId: number | null;
    modifierMode: SquareModifierMode;
}

/**
 * Save-time rules for a manually mapped variation link. Link tables aren't
 * `EntityBase`s, so this isn't a `ValidatorBase`; it builds the same
 * `ValidationErrorMap` tree, which the caller throws as a
 * `ValidationException`.
 */
@Injectable()
export class SquareVariationLinkValidator {
    constructor(
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
        @InjectRepository(SquareModifierLink)
        private readonly modifierRepo: Repository<SquareModifierLink>,
    ) {}

    /** Null when the mapping can be saved. */
    async validate(
        link: SquareVariationLink,
        mapping: SquareVariationMapping,
    ): Promise<ValidationErrorMap | null> {
        const errorMap = new ValidationErrorMap(link.id);
        const menuItem =
            mapping.menuItemId == null
                ? null
                : await this.menuItemRepo.findOne({
                      where: {
                          id: mapping.menuItemId,
                          tenantId: link.tenantId,
                      },
                      relations: { sizes: true },
                      loadEagerRelations: false,
                  });

        if (mapping.menuItemId != null && !menuItem) {
            errorMap.addError(
                'REFERENCE_NOT_FOUND',
                undefined,
                ['menuItemId'],
                {
                    value: mapping.menuItemId,
                },
            );
        }

        if (mapping.menuItemId == null && mapping.menuItemSizeId != null) {
            errorMap.addError('INCONSISTENT_STATE', undefined, [
                'menuItemId',
                'menuItemSizeId',
            ]);
        } else if (
            mapping.menuItemId != null &&
            mapping.menuItemSizeId == null
        ) {
            errorMap.addError('MISSING_PROPERTY', undefined, [
                'menuItemSizeId',
            ]);
        } else if (
            menuItem &&
            mapping.menuItemSizeId != null &&
            !menuItem.sizes.some((size) => size.id === mapping.menuItemSizeId)
        ) {
            // The size must be one the chosen menu item is offered in
            errorMap.addError(
                'INVALID_REFERENCE',
                undefined,
                ['menuItemSizeId'],
                { value: mapping.menuItemSizeId },
            );
        }

        if (mapping.modifierMode === 'container_contents') {
            const isVariableContainer =
                menuItem?.type === MENU_ITEM_TYPES.CONTAINER &&
                menuItem.variableMaxAmount != null;
            if (!isVariableContainer) {
                errorMap.addError('INCONSISTENT_STATE', undefined, [
                    'modifierMode',
                ]);
            }
        }

        if (
            mapping.modifierMode === 'modifier_is_item' &&
            !(await this.hasModifierLists(link))
        ) {
            errorMap.addError('INCONSISTENT_STATE', undefined, [
                'modifierMode',
            ]);
        }

        return errorMap.isEmpty() ? null : errorMap;
    }

    /**
     * Whether a live modifier list is attached to the variation's item
     * (Square attaches lists to items, not variations).
     */
    private async hasModifierLists(
        link: SquareVariationLink,
    ): Promise<boolean> {
        return this.modifierRepo
            .createQueryBuilder('m')
            .where('m.tenantId = :tenantId', { tenantId: link.tenantId })
            .andWhere('m.isDeleted = false')
            .andWhere(':itemId = ANY(m.squareItemIds)', {
                itemId: link.squareItemId,
            })
            .getExists();
    }
}
