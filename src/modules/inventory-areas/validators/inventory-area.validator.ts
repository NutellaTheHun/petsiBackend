import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { InventoryArea } from "../entities/inventory-area.entity";

@Injectable()
export class InventoryAreaValidator extends ValidatorBase<InventoryArea> {
    constructor(
        @InjectRepository(InventoryArea)
        private readonly repo: Repository<InventoryArea>,
    ) { super(repo); }

    public async validateCreate(dto: CreateInventoryAreaDto): Promise<void> {

        // Already exists check
        if (await this.helper.exists(this.repo, 'areaName', dto.areaName)) {
            this.addError({
                error: 'Inventory area name already exists.',
                status: 'EXIST',
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
                    error: 'Inventory area name already exists.',
                    status: 'EXIST',
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