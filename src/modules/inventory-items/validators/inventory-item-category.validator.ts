import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import {
    InventoryItemCategory,
    InventoryItemCategoryEntity,
} from '../entities/inventory-item-category.entity';
import { InventoryItemCategoryValidatorIdentity } from './identities/inventory-item-category.validator.identity.interface';

@Injectable()
export class InventoryItemCategoryValidator extends ValidatorBase<InventoryItemCategoryEntity, InventoryItemCategoryValidatorIdentity> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly repo: Repository<InventoryItemCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryItemCategory', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryItemCategoryValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
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

        return errorMap;
    }
    public async resolveIdentity(dto: CreateInventoryItemCategoryDto | UpdateInventoryItemCategoryDto, id: number | string): Promise<InventoryItemCategoryValidatorIdentity> {
        return {
            name: dto.name,
        } as InventoryItemCategoryValidatorIdentity;
    }
}
