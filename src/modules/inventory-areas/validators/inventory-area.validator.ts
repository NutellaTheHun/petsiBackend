import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly repo: Repository<InventoryArea>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'InventoryArea', requestContextService, logger); }

    public async validateCreate(dto: CreateInventoryAreaDto): Promise<void> {

        // Already exists check
        if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
            this.addError({
                errorMessage: 'Inventory area name already exists.',
                errorType: 'EXIST',
                contextEntity: 'CreateInventoryAreaDto',
                sourceEntity: 'InventoryArea',
                value: dto.areaName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateInventoryAreaDto): Promise<void> {

        // Already exists check
        if (dto.areaName) {
            if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
                this.addError({
                    errorMessage: 'Inventory area name already exists.',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateInventoryAreaDto',
                    contextId: id,
                    sourceEntity: 'InventoryArea',
                    value: dto.areaName,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}