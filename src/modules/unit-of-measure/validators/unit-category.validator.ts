import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { UnitCategory } from "../entities/unit-category.entity";

@Injectable()
export class UnitCategoryValidator extends ValidatorBase<UnitCategory> {
    constructor(
        @InjectRepository(UnitCategory)
        private readonly repo: Repository<UnitCategory>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Unit category with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}