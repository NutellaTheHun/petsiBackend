import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidatorIdentityBaseInterface } from '../../../common/base/validator-identity.base.interface';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { InventoryItemSizeValidatorIdentity } from '../../inventory-items/validators/identities/inventory-item-size.validator.identity.interface';
import { InventoryItemSizeValidator } from '../../inventory-items/validators/inventory-item-size.validator';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaItemDto } from '../dto/inventory-area-item/create-inventory-area-item.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import { NestedUpdateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-update-inventory-area-item.dto';
import { UpdateInventoryAreaItemDto } from '../dto/inventory-area-item/update-inventory-area-item.dto';
import {
    InventoryAreaItem,
    InventoryAreaItemEntity,
} from '../entities/inventory-area-item.entity';
import { InventoryAreaItemValidatorIdentity } from './identities/inventory-area-item.validator.identity.interface';

@Injectable()
export class InventoryAreaItemValidator extends NestedValidatorBase<InventoryAreaItemEntity, InventoryAreaItemValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryAreaItem)
        private readonly repo: Repository<InventoryAreaItem>,

        @InjectRepository(InventoryItem)
        private readonly inventoryItemRepo: Repository<InventoryItem>,

        @Inject(forwardRef(() => InventoryItemSizeValidator))
        private readonly itemSizeValidator: InventoryItemSizeValidator,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryAreaItem', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryAreaItemValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // Enforce only one of countedItemSizeId or countedItemSize
        this.helper.enforceOnlyOne(
            identity,
            'countedItemSize',
            'countedItemSizeId',
            errorMap,
        );

        if (identity.countedInventoryItemId !== undefined) {
            // Enforce exists
            await this.helper.enforceExists(
                identity.countedInventoryItemId,
                this.inventoryItemRepo,
                'countedInventoryItem',
                errorMap,
            );
        }

        if (identity.countedItemSizeId && identity.countedInventoryItemId) {
            // Enforce valid size
            await this.helper.enforceValidSize(
                identity.countedItemSizeId,
                identity.countedInventoryItemId,
                this.inventoryItemRepo,
                'sizes',
                'countedItemSize',
                errorMap,
            );
        }

        if (identity.countedItemSize) {
            // Nested validator call, must include inventoryItemId to check if it exists already.
            let resolvedIdentity: InventoryItemSizeValidatorIdentity = identity.countedItemSize;
            if (identity.countedInventoryItemId) {
                resolvedIdentity = { ...resolvedIdentity, inventoryItemId: identity.countedInventoryItemId };
            }

            await this.itemSizeValidator.validateNestedIdentity(
                'countedItemSize',
                resolvedIdentity,
                errorMap,
            );
        }

        if (identity.amount !== undefined) {
            // Enforce positive amount
            this.helper.enforcePositive(
                identity.amount,
                'amount',
                errorMap,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateInventoryAreaItemDto | UpdateInventoryAreaItemDto | NestedCreateInventoryAreaItemDto | NestedUpdateInventoryAreaItemDto, id: number | string): Promise<ValidatorIdentityBaseInterface> {
        if (dto instanceof NestedCreateInventoryAreaItemDto || dto instanceof CreateInventoryAreaItemDto) {
            return {
                createId: dto instanceof NestedCreateInventoryAreaItemDto ? dto.createId : undefined,
                countedInventoryItemId: dto.countedInventoryItemId,
                amount: dto.amount,
                countedItemSizeId: dto.countedItemSizeId,
                countedItemSize: dto.countedItemSize ? await this.itemSizeValidator.resolveIdentity(dto.countedItemSize, dto.countedItemSize.createId) : undefined,
                parentInventoryCountId: dto instanceof CreateInventoryAreaItemDto ? dto.parentInventoryCountId : undefined,
            } as InventoryAreaItemValidatorIdentity;
        }

        return {
            id: dto instanceof NestedUpdateInventoryAreaItemDto ? dto.id : undefined,
            countedInventoryItemId: dto.countedInventoryItemId,
            amount: dto.amount,
            countedItemSizeId: dto.countedItemSizeId,
            countedItemSize: dto.countedItemSize ? await this.itemSizeValidator.resolveIdentity(dto.countedItemSize, dto.countedItemSize.createId) : undefined,
        } as InventoryAreaItemValidatorIdentity
    }
}
