import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { NestedCreateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-create-inventory-item-size.dto';
import { NestedUpdateInventoryItemSizeDto } from '../dto/inventory-item-size/nested-update-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import {
    InventoryItemSize,
    InventoryItemSizeEntity,
} from '../entities/inventory-item-size.entity';
import { InventoryItemSizeValidatorIdentity } from './identities/inventory-item-size.validator.identity.interface';

@Injectable()
export class InventoryItemSizeValidator extends NestedValidatorBase<InventoryItemSizeEntity, InventoryItemSizeValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly repo: Repository<InventoryItemSize>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryItemSize', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryItemSizeValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.inventoryItemId) {
            this.helper.enforceExists(
                identity.inventoryItemId,
                this.repo,
                'inventoryItem',
                errorMap,
            );
        }

        if (identity.packageId) {
            this.helper.enforceExists(
                identity.packageId,
                this.repo,
                'package',
                errorMap,
            );
        }

        if (identity.measureTypeId) {
            this.helper.enforceExists(
                identity.measureTypeId,
                this.repo,
                'measureType',
                errorMap,
            );
        }

        if (identity.cost) {
            this.helper.enforcePositive(
                identity.cost,
                'measureAmount',
                errorMap,
            );
        }

        if (identity.measureAmount) {
            this.helper.enforcePositive(
                identity.measureAmount,
                'measureAmount',
                errorMap,
            );
        }

        if (identity.measureAmount && identity.packageId && identity.measureTypeId && identity.inventoryItemId) {
            const exists = await this.repo.findOne({
                where: {
                    measureType: { id: identity.measureTypeId },
                    package: {
                        id: identity.packageId,
                    },
                    inventoryItem: { id: identity.inventoryItemId },
                    measureAmount: identity.measureAmount,
                },
            });
            if (exists) {
                errorMap.addError('ALREADY_EXISTS', undefined, ['inventoryItem', 'measureType', 'package', 'measureAmount']);
            }
        }

        return errorMap;
    }
    public async resolveIdentity(dto: CreateInventoryItemSizeDto | UpdateInventoryItemSizeDto | NestedCreateInventoryItemSizeDto | NestedUpdateInventoryItemSizeDto, id: number | string): Promise<InventoryItemSizeValidatorIdentity> {
        if (dto instanceof CreateInventoryItemSizeDto || dto instanceof NestedCreateInventoryItemSizeDto) {
            return {
                createId: dto instanceof NestedCreateInventoryItemSizeDto ? dto.createId : undefined,
                inventoryItemId: dto instanceof CreateInventoryItemSizeDto ? dto.inventoryItemId : undefined,
                cost: dto.cost,
                measureAmount: dto.measureAmount,
                packageId: dto.packageId,
                measureTypeId: dto.measureTypeId,
            } as InventoryItemSizeValidatorIdentity;
        }

        return {
            id: dto instanceof NestedUpdateInventoryItemSizeDto ? dto.id : undefined,
            cost: dto.cost,
            measureAmount: dto.measureAmount,
            packageId: dto.packageId,
            measureTypeId: dto.measureTypeId,
        } as InventoryItemSizeValidatorIdentity;
    }
}
