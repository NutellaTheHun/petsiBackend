import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { CreateUnitOfMeasureDto } from "../dto/unit-of-measure/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/unit-of-measure/update-unit-of-measure.dto";

@Injectable()
export class UnitOfMeasureValidator extends ValidatorBase<UnitOfMeasure> {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly repo: Repository<UnitOfMeasure>,
    ){ super(repo); }

    public async validateCreate(dto: CreateUnitOfMeasureDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.unitName }});
        if(exists) { 
            return `Unit of measure with name ${dto.unitName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateUnitOfMeasureDto): Promise<string | null> {
        return null;
    }
}