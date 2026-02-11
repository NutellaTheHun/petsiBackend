import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import {
    InventoryItem,
    InventoryItemEntity,
} from '../entities/inventory-item.entity';
import { InventoryItemSizeValidatorIdentity } from './identities/inventory-item-size.validator.identity.interface';
import { InventoryItemValidatorIdentity } from './identities/inventory-item.validator.identity.interface';
import { InventoryItemSizeValidator } from './inventory-item-size.validator';

@Injectable()
export class InventoryItemValidator extends ValidatorBase<InventoryItemEntity, InventoryItemValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryItem)
        private readonly repo: Repository<InventoryItem>,

        @Inject(forwardRef(() => InventoryItemSizeValidator))
        private readonly itemSizeValidator: InventoryItemSizeValidator,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryItem', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryItemValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
                id,
            );
        }

        if (identity.categoryId) {
            await this.helper.enforceExists(
                identity.categoryId,
                this.repo,
                'category',
                errorMap,
            );
        }

        if (identity.vendorId) {
            await this.helper.enforceExists(
                identity.vendorId,
                this.repo,
                'vendor',
                errorMap,
            );
        }

        if (identity.sizes && identity.sizes?.length) {
            for (const size of identity.sizes) {
                await this.itemSizeValidator.validateNestedIdentity(
                    'sizes',
                    size,
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateInventoryItemDto | UpdateInventoryItemDto, id: number | string): Promise<InventoryItemValidatorIdentity> {
        const sizeIdentities: InventoryItemSizeValidatorIdentity[] = [];
        if (dto.sizes && dto.sizes.length) {
            for (const size of dto.sizes) {
                sizeIdentities.push(await this.itemSizeValidator.resolveIdentity(
                    size,
                    id,
                ));
            }
        }

        return {
            name: dto.name,
            categoryId: dto.categoryId,
            vendorId: dto.vendorId,
            sizes: sizeIdentities,
        } as InventoryItemValidatorIdentity;
    }
}
