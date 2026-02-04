import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidatorIdentityBaseInterface } from '../../../common/base/validator-identity.base.interface';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
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

    protected async validateIdentity(identity: InventoryAreaItemValidatorIdentity, id?: number): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);


        if (identity.countedItemSizeId || identity.countedItemSize) {
            // Enforce only one of countedItemSizeId or countedItemSize
            this.helper.enforceOnlyOne(
                identity,
                'countedItemSize',
                'countedItemSizeId',
                errorMap,
            );
        }

        if (identity.countedInventoryItemId) {
            // Enforce exists
            await this.helper.enforceExists(
                identity.countedInventoryItemId,
                this.inventoryItemRepo,
                'countedInventoryItem',
                errorMap,
            );

            // If countedInventoryItemId, then countedItemSizeId or countedItemSize must be provided for either create or update
            // Enforce only one of countedItemSizeId or countedItemSize
            this.helper.enforceOnlyOne(
                identity,
                'countedItemSize',
                'countedItemSizeId',
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
            // Nested validator call
            await this.itemSizeValidator.validateNestedIdentity(
                'countedItemSize',
                identity.countedItemSize,
                errorMap,
            );
        }

        if (identity.amount) {
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
                countedItemSize: dto.countedItemSize,
                parentInventoryCountId: dto instanceof CreateInventoryAreaItemDto ? dto.parentInventoryCountId : undefined,
            } as InventoryAreaItemValidatorIdentity;
        }

        const entity = await this.repo.findOne({
            where: { id: id as number },
            relations: ['countedItemSize', 'countedInventoryItem'],
        });
        if (!entity) {
            throw new Error();
        }

        // If updating countedItem and no size provided, get the size from the current entity
        let sizeId: number | null = null;
        if (dto.countedInventoryItemId && !dto.countedItemSize && !dto.countedItemSizeId) {
            sizeId = entity.countedItemSize.id;
        }


        // if updating size and no counted item provided, get the item from the current entity
        let countedItemId: number | null = null;
        if (dto.countedItemSizeId && !dto.countedInventoryItemId) {
            countedItemId = entity.countedInventoryItem.id;
        }

        return {
            countedInventoryItemId: dto.countedInventoryItemId ?? countedItemId ?? undefined,
            amount: dto.amount,
            countedItemSizeId: dto.countedItemSizeId ?? sizeId ?? undefined,
            countedItemSize: dto.countedItemSize,
        } as InventoryAreaItemValidatorIdentity;
    }


    protected async doValidateCreateNode(
        dto: CreateInventoryAreaItemDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // Counted Amount
        this.helper.enforcePositive(
            dto.amount,
            'amount',
            errorMap,
        );

        // InventoryItemSize ID and InventoryItemSizeDto
        this.helper.enforceOnlyOne(
            dto,
            'countedItemSize',
            'countedItemSizeId',
            errorMap,
        );

        // CountedItemSize Reference
        if (dto.countedItemSizeId) {
            await this.helper.enforceValidSize(
                dto.countedItemSizeId,
                dto.countedInventoryItemId,
                this.inventoryItemRepo,
                'sizes',
                'countedItemSize',
                errorMap,
            );
        }

        // Nested validator call
        if (dto.countedItemSize) {
            await this.itemSizeValidator.validateNestedNode(
                'countedItemSize',
                dto.countedItemSize,
                errorMap,
            );
        }

        return errorMap;
    }

    protected async doValidateNestedCreateNode(
        dto: NestedCreateInventoryAreaItemDto,
        id: string,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested create and root create
        return await this.doValidateCreateNode(
            dto as unknown as CreateInventoryAreaItemDto,
            id,
        );
    }

    protected async doValidateNestedUpdateNode(
        dto: NestedUpdateInventoryAreaItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested update and root update
        return await this.doValidateUpdateNode(
            dto as unknown as UpdateInventoryAreaItemDto,
            id,
        );
    }

    protected async doValidateUpdateNode(
        dto: UpdateInventoryAreaItemDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // Counted Amount
        if (dto.amount) {
            this.helper.enforcePositive(
                dto.amount,
                'amount',
                errorMap,
            );
        }

        // If new counted InventoryItem, must have new size assignment.
        if (dto.countedInventoryItemId) {
            this.helper.enforceOnlyOne(
                dto,
                'countedItemSize',
                'countedItemSizeId',
                errorMap,
            );
        }

        if (dto.countedItemSize || dto.countedItemSizeId) {
            await this.helper.enforceOnlyOne(
                dto,
                'countedItemSize',
                'countedItemSizeId',
                errorMap,
            );
        }

        // Validate InventoryItemSize
        if (dto.countedItemSizeId) {
            let countedItemId: number | null = null;
            if (dto.countedInventoryItemId) {
                countedItemId = dto.countedInventoryItemId;
            } else {
                const currentItem = await this.repo.findOne({
                    where: { id },
                    relations: ['countedItem'],
                });
                if (!currentItem) {
                    throw new Error();
                }
                countedItemId = currentItem.countedInventoryItem.id;
            }

            await this.helper.enforceValidSize(
                dto.countedItemSizeId,
                countedItemId,
                this.inventoryItemRepo,
                'sizes',
                'countedItemSize',
                errorMap,
            );
        }

        // Nested ItemSize validation
        if (dto.countedItemSize) {
            await this.itemSizeValidator.validateNestedNode(
                'countedItemSize',
                dto.countedItemSize,
                errorMap,
            );
        }

        return errorMap;
    }
}
