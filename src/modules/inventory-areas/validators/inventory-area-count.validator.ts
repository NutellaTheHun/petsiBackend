import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Double, Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { CreateInventoryAreaCountDto } from "../dto/inventory-area-count/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/inventory-area-count/update-inventory-area-count.dto";
import { ValidationError } from "../../../util/exceptions/validation-error";

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCount> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly repo: Repository<InventoryAreaCount>,
    ) { super(repo); }

    public async validateCreate(dto: CreateInventoryAreaCountDto): Promise<void> {
        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateInventoryAreaCountDto): Promise<void> {

        // no duplicate update dtos (same id)
        if (dto.itemCountDtos && dto.itemCountDtos.length > 0) {
            const resolvedDtos: { id: number }[] = [];
            for (const d of dto.itemCountDtos) {
                if (d.mode === 'update') {
                    resolvedDtos.push({ id: d.id });
                }
            }
            const duplicateIds = this.helper.findDuplicates(resolvedDtos, (id) => `${id.id}`);
            if (duplicateIds.length > 0) {
                duplicateIds.map(dup => this.addError({
                    error: 'duplicate update requests for counted inventory item.',
                    status: 'DUPLICATE',
                    contextEntity: 'UpdateInventoryAreaCountDto',
                    contextId: id,
                    sourceEntity: 'UpdateChildInventoryAreaItemDto',
                    sourceId: dup.id,
                } as ValidationError));
            }
        }

        this.throwIfErrors()
    }
}