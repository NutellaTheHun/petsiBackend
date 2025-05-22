import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { CreateInventoryAreaCountDto } from "../dto/inventory-area-count/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/inventory-area-count/update-inventory-area-count.dto";

@Injectable()
export class InventoryAreaCountValidator extends ValidatorBase<InventoryAreaCount> {
    constructor(
        @InjectRepository(InventoryAreaCount)
        private readonly repo: Repository<InventoryAreaCount>,
    ){ super(repo); }

    public async validateCreate(dto: CreateInventoryAreaCountDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateInventoryAreaCountDto): Promise<string | null> {
        // no duplicate update dtos (same id)
        if(dto.itemCountDtos && dto.itemCountDtos.length > 0){
            const resolvedDtos: {updateId: number}[] = [];
            for(const d of dto.itemCountDtos){
                if(d.mode === 'update'){
                    resolvedDtos.push({ updateId: d.id});
                }
            }
            const hasDuplateIds = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (resolved) => `${resolved.updateId}`
            );
            if(hasDuplateIds){
                return `multiple update dtos for same id`;
            }
        }
        return null;
    }
}