import { Injectable, NotFoundException } from '@nestjs/common';
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

        if (identity.measureAmount || identity.packageId || identity.measureTypeId) {
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

        const entity = await this.repo.findOne({
            where: {
                id: id as number,
            },
            relations: ['inventoryItem', 'measureType', 'package'],
        });
        if (!entity) {
            throw new NotFoundException();
        }

        let measureTypeId: number | null = null;
        let packageId: number | null = null;
        let measureAmount: number | null = null;
        let inventoryItemId: number | null = null;
        if (dto.measureTypeId || dto.packageId || dto.measureAmount
        ) {
            measureTypeId = dto.measureTypeId ?? entity.measureType.id;
            packageId = dto.packageId ?? entity.package.id;
            measureAmount = dto.measureAmount ?? entity.measureAmount;
            inventoryItemId = entity.inventoryItem.id;
        }

        return {
            id: entity.id,
            cost: dto.cost,
            measureAmount: measureAmount ?? undefined,
            inventoryItemId: inventoryItemId ?? undefined,
            packageId: packageId ?? undefined,
            measureTypeId: measureTypeId ?? undefined,
        } as InventoryItemSizeValidatorIdentity;
    }

    protected async doValidateCreateNode(
        dto: CreateInventoryItemSizeDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // measureAmount
        this.helper.enforcePositive(
            dto.measureAmount,
            'measureAmount',
            errorMap,
        );

        // cost
        this.helper.enforcePositive(
            dto.cost,
            'cost',
            errorMap,
        );

        // check for current package / unit of measure / cost already exists?
        const exists = await this.repo.findOne({
            where: {
                measureType: { id: dto.measureTypeId },
                package: {
                    id: dto.packageId,
                },
                inventoryItem: { id: dto.inventoryItemId },
                measureAmount: dto.measureAmount,
            },
        });
        if (exists) {
            // Most relevant conflict signal for FE is the measure type selection.
            errorMap.addChild(
                'measureType',
                new ValidationErrorMap(undefined, 'item size already exists'),
            );
            errorMap.addChild(
                'package',
                new ValidationErrorMap(undefined, 'item size already exists'),
            );
            errorMap.addChild(
                'measureAmount',
                new ValidationErrorMap(undefined, 'item size already exists'),
            );
        }

        return errorMap;
    }

    protected async doValidateNestedCreateNode(
        dto: NestedCreateInventoryItemSizeDto,
        id: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // measureAmount
        this.helper.enforcePositive(
            dto.measureAmount,
            'measureAmount',
            errorMap,
        );

        // cost
        this.helper.enforcePositive(
            dto.cost,
            'cost',
            errorMap,
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateInventoryItemSizeDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // measureAmount cannot be less than or equal to 0
        if (dto.measureAmount) {
            this.helper.enforcePositive(
                dto.measureAmount,
                'measureAmount',
                errorMap,
            );
        }

        // cost cannot be less than or equal to 0
        if (dto.cost) {
            this.helper.enforcePositive(
                dto.cost,
                'cost',
                errorMap,
            );
        }

        // Cant update a item size to a already existing combination of packageType and measure unit size.
        if (dto.measureTypeId || dto.packageId) {
            const currentSize = await this.repo.findOne({
                where: { id },
                relations: ['inventoryItem', 'measureType', 'package'],
            });
            if (!currentSize) {
                throw new NotFoundException();
            }
            const exists = await this.repo.findOne({
                where: {
                    measureType: { id: dto.measureTypeId ?? currentSize.measureType.id },
                    package: {
                        id: dto.packageId ?? currentSize.package.id,
                    },
                    inventoryItem: { id: currentSize.inventoryItem.id },
                },
            });
            if (exists) {
                const prop = dto.measureTypeId ? 'measureType' : 'package';
                errorMap.addChild(
                    prop,
                    new ValidationErrorMap(
                        undefined,
                        'Inventory item size already exists',
                    ),
                );
            }
        }

        return errorMap;
    }

    protected async doValidateNestedUpdateNode(
        dto: NestedUpdateInventoryItemSizeDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        // Currently no difference in validation between nested update and root update
        return await this.doValidateUpdateNode(
            dto as unknown as UpdateInventoryItemSizeDto,
            id,
        );
    }
}
