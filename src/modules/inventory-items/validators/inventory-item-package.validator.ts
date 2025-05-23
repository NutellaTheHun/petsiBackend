import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { CreateInventoryItemPackageDto } from "../dto/inventory-item-package/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/inventory-item-package/update-inventory-item-package.dto";
import { ValidationError } from "../../../util/exceptions/validation-error";

@Injectable()
export class InventoryItemPackageValidator extends ValidatorBase<InventoryItemPackage> {
    constructor(
        @InjectRepository(InventoryItemPackage)
        private readonly repo: Repository<InventoryItemPackage>,
    ) { super(repo); }

    public async validateCreate(dto: CreateInventoryItemPackageDto): Promise<void> {
        // Already exists check
        if (await this.helper.exists(this.repo, 'packageName', dto.packageName)) {
            this.addError({
                error: 'Inventory package name already exists',
                status: 'EXIST',
                contextEntity: 'CreateInventoryItemPackageDto',
                sourceEntity: 'InventoryPackage',
                value: dto.packageName,
            } as ValidationError);
        }
        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateInventoryItemPackageDto): Promise<void> {
        // Already exists check
        if (dto.packageName) {
            if (await this.helper.exists(this.repo, 'packageName', dto.packageName)) {
                this.addError({
                    error: 'Inventory package name already exists',
                    status: 'EXIST',
                    contextEntity: 'UpdateInventoryItemPackageDto',
                    contextId: id,
                    sourceEntity: 'InventoryPackage',
                    value: dto.packageName,
                } as ValidationError);
            }
        }
        this.throwIfErrors()
    }
}