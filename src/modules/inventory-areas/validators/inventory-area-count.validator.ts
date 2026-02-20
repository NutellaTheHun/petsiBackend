import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorIdentityBaseInterface } from '../../../common/base/validator-identity.base.interface';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { NestedCreateInventoryAreaItemDto } from '../dto/inventory-area-item/nested-create-inventory-area-item.dto';
import {
    InventoryAreaCount,
    InventoryAreaCountEntity,
} from '../entities/inventory-area-count.entity';
import { InventoryArea } from '../entities/inventory-area.entity';
import { InventoryAreaCountValidatorIdentity } from './identities/inventory-area-count.validator.identity.interface';
import { InventoryAreaItemValidatorIdentity } from './identities/inventory-area-item.validator.identity.interface';
import { InventoryAreaItemValidator } from './inventory-area-item.validator';

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCountEntity, InventoryAreaCountValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly repo: Repository<InventoryAreaCount>,
        logger: AppLogger,
        requestContextService: RequestContextService,

        @InjectRepository(InventoryArea)
        private readonly inventoryAreaRepo: Repository<InventoryArea>,

        @Inject(forwardRef(() => InventoryAreaItemValidator))
        private readonly areaItemValidator: InventoryAreaItemValidator,
    ) {
        super(repo, 'InventoryAreaCount', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryAreaCountValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.inventoryAreaId !== undefined) {
            // enforce exists
            await this.helper.enforceExists(
                identity.inventoryAreaId,
                this.inventoryAreaRepo,
                'inventoryArea',
                errorMap,
            );
        }

        if (identity.countedInventoryItems && identity.countedInventoryItems.length > 0) {
            for (const item of identity.countedInventoryItems) {
                await this.areaItemValidator.validateNestedIdentity('countedInventoryItems', item, errorMap);
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: UpdateInventoryAreaCountDto | CreateInventoryAreaCountDto, id: number): Promise<ValidatorIdentityBaseInterface> {
        let countedItemIdentities: InventoryAreaItemValidatorIdentity[] = [];
        if (dto.countedInventoryItems && dto.countedInventoryItems.length > 0) {
            for (const item of dto.countedInventoryItems) {
                let itemId = item instanceof NestedCreateInventoryAreaItemDto ? item.createId : item.id;
                countedItemIdentities.push(await this.areaItemValidator.resolveIdentity(item, itemId));
            }
        }

        return {
            inventoryAreaId: dto.inventoryAreaId,
            countedInventoryItems: countedItemIdentities,
        } as InventoryAreaCountValidatorIdentity
    }
}
