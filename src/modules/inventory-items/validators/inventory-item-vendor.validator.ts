import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemVendorDto } from '../dto/inventory-item-vendor/create-inventory-item-vendor.dto';
import { UpdateInventoryItemVendorDto } from '../dto/inventory-item-vendor/update-inventory-item-vendor.dto';
import {
    InventoryItemVendor,
    InventoryItemVendorEntity,
} from '../entities/inventory-item-vendor.entity';
import { InventoryItemVendorValidatorIdentity } from './identities/inventory-item-vendor.validator.identity.interface';

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendorEntity, InventoryItemVendorValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly repo: Repository<InventoryItemVendor>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryItemVendor', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryItemVendorValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
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
    public async resolveIdentity(dto: CreateInventoryItemVendorDto | UpdateInventoryItemVendorDto, id: number | string): Promise<InventoryItemVendorValidatorIdentity> {
        return {
            name: dto.name,
        } as InventoryItemVendorValidatorIdentity;
    }
}
