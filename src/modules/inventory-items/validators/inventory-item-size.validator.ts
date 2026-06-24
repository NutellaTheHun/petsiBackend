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
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import {
    InventoryItemSize,
    InventoryItemSizeEntity,
} from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemSizeValidatorIdentity } from './identities/inventory-item-size.validator.identity.interface';

@Injectable()
export class InventoryItemSizeValidator extends NestedValidatorBase<InventoryItemSizeEntity, InventoryItemSizeValidatorIdentity> {

    constructor(
        @InjectRepository(InventoryItemSize)
        private readonly repo: Repository<InventoryItemSize>,

        @InjectRepository(InventoryItem)
        private readonly inventoryItemRepo: Repository<InventoryItem>,

        @InjectRepository(InventoryItemPackage)
        private readonly packageRepo: Repository<InventoryItemPackage>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'InventoryItemSize', requestContextService, logger);
    }

    protected async validateIdentity(identity: InventoryItemSizeValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.inventoryItemId !== undefined) {
            this.helper.enforceExists(
                identity.inventoryItemId,
                this.inventoryItemRepo,
                'inventoryItem',
                errorMap,
            );
        }

        if (identity.packageId !== undefined) {
            this.helper.enforceExists(
                identity.packageId,
                this.packageRepo,
                'package',
                errorMap,
            );
        }

        if (identity.cost !== undefined && identity.cost !== null) {
            this.helper.enforcePositive(
                identity.cost,
                'cost',
                errorMap,
            );
        }

        if (identity.measureAmount !== undefined) {
            this.helper.enforcePositive(
                identity.measureAmount,
                'measureAmount',
                errorMap,
            );
        }

        if (identity.measureAmount !== undefined && identity.packageId && identity.unit && identity.inventoryItemId) {
            const exists = await this.repo.findOne({
                where: {
                    unit: identity.unit,
                    package: {
                        id: identity.packageId,
                    },
                    inventoryItem: { id: identity.inventoryItemId },
                    measureAmount: identity.measureAmount,
                },
            });
            if (exists && exists.id !== id) {
                errorMap.addError('ALREADY_EXISTS', undefined, ['unit', 'package', 'measureAmount']);
                console.log("ALREADY EXISTS");
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
                unit: dto.unit,
            } as InventoryItemSizeValidatorIdentity;
        }

        const currentSize = await this.repo.findOne({
            where: {
                id: id as number,
            },
            relations: ['inventoryItem'],
        });
        if (!currentSize) {
            throw new Error('Cant find current size');
        }

        return {
            id: dto instanceof NestedUpdateInventoryItemSizeDto ? dto.id : undefined,
            cost: dto.cost,
            measureAmount: dto.measureAmount,
            packageId: dto.packageId,
            unit: dto.unit,
            inventoryItemId: currentSize.inventoryItem.id,
        } as InventoryItemSizeValidatorIdentity;
    }
}
