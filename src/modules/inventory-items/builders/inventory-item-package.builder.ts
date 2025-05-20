import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateInventoryItemPackageDto } from "../dto/inventory-item-package/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/inventory-item-package/update-inventory-item-package.dto";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageValidator } from "../validators/inventory-item-package.validator";

@Injectable()
export class InventoryItemPackageBuilder extends BuilderBase<InventoryItemPackage> {
    constructor(
        validator: InventoryItemPackageValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(InventoryItemPackage, 'InventoryItemPackageBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateInventoryItemPackageDto): void {
        if(dto.packageName !== undefined){
            this.name(dto.packageName);
        }
    }
    protected updateEntity(dto: UpdateInventoryItemPackageDto): void {
        if(dto.packageName !== undefined){
            this.name(dto.packageName);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('packageName', name);
    }
}