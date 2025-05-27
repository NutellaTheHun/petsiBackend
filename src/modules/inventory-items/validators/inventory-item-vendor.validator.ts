import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateInventoryItemVendorDto } from "../dto/inventory-item-vendor/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/inventory-item-vendor/update-inventory-item-vendor.dto";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class InventoryItemVendorValidator extends ValidatorBase<InventoryItemVendor> {
    constructor(
        @InjectRepository(InventoryItemVendor)
        private readonly repo: Repository<InventoryItemVendor>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'InventoryItemVendor', requestContextService, logger); }

    public async validateCreate(dto: CreateInventoryItemVendorDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'vendorName', dto.vendorName)) {
            this.addError({
                errorMessage: 'Inventory vendor already exists',
                errorType: 'EXIST',
                contextEntity: 'CreateInventoryItemVendorDto',
                sourceEntity: 'InventoryItemVendor',
                value: dto.vendorName
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateInventoryItemVendorDto): Promise<void> {
        if (dto.vendorName) {
            if (await this.helper.exists(this.repo, 'vendorName', dto.vendorName)) {
                this.addError({
                    errorMessage: 'Inventory vendor already exists',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateInventoryItemVendorDto',
                    contextId: id,
                    sourceEntity: 'InventoryItemVendor',
                    value: dto.vendorName
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}