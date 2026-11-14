import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MENU_ITEM_TYPES } from '../../menu-items/utils/menu-item-type';
import { SquareModifierLink } from '../entities/square-modifier-link.entity';
import { ModifierMapping } from '../utils/square-modifier-siblings';

/**
 * Save-time rules for a modifier link's mapping, built like
 * `SquareVariationLinkValidator`. `ignore` takes no menu item; `item` takes
 * both a `SINGLE` menu item and one of its sizes, or neither (unmapped).
 */
@Injectable()
export class SquareModifierLinkValidator {
    constructor(
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
    ) {}

    /** Null when the mapping can be saved. */
    async validate(
        link: SquareModifierLink,
        mapping: ModifierMapping,
    ): Promise<ValidationErrorMap | null> {
        const errorMap = new ValidationErrorMap(link.id);

        if (mapping.kind === 'ignore') {
            if (mapping.menuItemId != null || mapping.menuItemSizeId != null) {
                errorMap.addError('INCONSISTENT_STATE', undefined, [
                    'kind',
                    'menuItemId',
                ]);
            }
            return errorMap.isEmpty() ? null : errorMap;
        }

        if (mapping.menuItemId == null) {
            if (mapping.menuItemSizeId != null) {
                errorMap.addError('INCONSISTENT_STATE', undefined, [
                    'menuItemId',
                    'menuItemSizeId',
                ]);
            }
            return errorMap.isEmpty() ? null : errorMap;
        }

        const menuItem = await this.menuItemRepo.findOne({
            where: { id: mapping.menuItemId, tenantId: link.tenantId },
            relations: { sizes: true },
            loadEagerRelations: false,
        });
        if (!menuItem) {
            errorMap.addError(
                'REFERENCE_NOT_FOUND',
                undefined,
                ['menuItemId'],
                { value: mapping.menuItemId },
            );
        } else if (menuItem.type !== MENU_ITEM_TYPES.SINGLE) {
            // A flavor is one item; a container can't go inside a box
            errorMap.addError('INVALID_REFERENCE', undefined, ['menuItemId'], {
                value: mapping.menuItemId,
            });
        }

        if (mapping.menuItemSizeId == null) {
            errorMap.addError('MISSING_PROPERTY', undefined, [
                'menuItemSizeId',
            ]);
        } else if (
            menuItem &&
            !menuItem.sizes.some((size) => size.id === mapping.menuItemSizeId)
        ) {
            errorMap.addError(
                'INVALID_REFERENCE',
                undefined,
                ['menuItemSizeId'],
                { value: mapping.menuItemSizeId },
            );
        }

        return errorMap.isEmpty() ? null : errorMap;
    }
}
