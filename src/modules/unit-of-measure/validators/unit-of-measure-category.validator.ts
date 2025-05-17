import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { UnitOfMeasureCategory } from "../entities/unit-of-measure-category.entity";
import { CreateUnitOfMeasureCategoryDto } from "../dto/create-unit-of-measure-category.dto";
import { UpdateUnitOfMeasureCategoryDto } from "../dto/update-unit-of-measure-category.dto";

@Injectable()
export class UnitOfMeasureCategoryValidator extends ValidatorBase<UnitOfMeasureCategory> {
    constructor(
        @InjectRepository(UnitOfMeasureCategory)
        private readonly repo: Repository<UnitOfMeasureCategory>,
    ){ super(repo); }

    public async validateCreate(dto: CreateUnitOfMeasureCategoryDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Unit category with name ${dto.name} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateUnitOfMeasureCategoryDto): Promise<string | null> {
        return null;
    }
}