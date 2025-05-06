import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";

@Injectable()
export class UnitOfMeasureValidator extends ValidatorBase<UnitOfMeasure> {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly repo: Repository<UnitOfMeasure>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Unit of measure with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}