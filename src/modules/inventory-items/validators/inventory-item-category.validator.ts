import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { CreateInventoryItemCategoryDto } from "../dto/inventory-item-category/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/inventory-item-category/update-inventory-item-category.dto";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class InventoryItemCategoryValidator extends ValidatorBase<InventoryItemCategory> {
    constructor(
        @InjectRepository(InventoryItemCategory)
        private readonly repo: Repository<InventoryItemCategory>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'InventoryItemCategory', requestContextService, logger); }

    public async validateCreate(dto: CreateInventoryItemCategoryDto): Promise<void> {
        // Already exists check
        if (await this.helper.exists(this.repo, 'categoryName', dto.itemCategoryName)) {
            this.addError({
                errorMessage: 'Inventory category name already exists',
                errorType: 'EXIST',
                contextEntity: 'CreateInventoryItemCategoryDto',
                sourceEntity: 'InventoryCategory',
                value: dto.itemCategoryName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateInventoryItemCategoryDto): Promise<void> {
        // Already exists check
        if (dto.itemCategoryName) {
            if (await this.helper.exists(this.repo, 'categoryName', dto.itemCategoryName)) {
                this.addError({
                    errorMessage: 'Inventory category name already exists',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateInventoryItemCategoryDto',
                    contextId: id,
                    sourceEntity: 'InventoryCategory',
                    value: dto.itemCategoryName,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}