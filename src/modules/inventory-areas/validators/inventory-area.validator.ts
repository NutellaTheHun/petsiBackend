import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaDto } from '../dto/inventory-area/create-inventory-area.dto';
import { UpdateInventoryAreaDto } from '../dto/inventory-area/update-inventory-area.dto';
import {
    InventoryArea,
    InventoryAreaEntity,
} from '../entities/inventory-area.entity';
import { InventoryAreaValidatorIdentity } from './identities/inventory-area.validator.identity.interface';

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryAreaEntity, InventoryAreaValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryArea)
        private readonly repo: Repository<InventoryArea>,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryArea', requestContextService);
    }

    protected async validateIdentity(identity: InventoryAreaValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        this.helper.enforceUnchanged(identity.existingLocationId, identity.locationId, 'locationId', errorMap);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
                id,
                {
                    tenantId: this.requestContextService.get<number>('tenantId'),
                    locationId: identity.locationId,
                },
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: UpdateInventoryAreaDto | CreateInventoryAreaDto, id: number | string): Promise<InventoryAreaValidatorIdentity> {
        return {
            name: dto.name,
            locationId: dto.locationId,
            existingLocationId: typeof id === 'number'
                ? (await this.repo.findOne({ where: { id }, select: { id: true, locationId: true } }))?.locationId
                : undefined,
        } as InventoryAreaValidatorIdentity;
    }
}
