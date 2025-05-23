import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { CreateUnitOfMeasureDto } from "../dto/unit-of-measure/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/unit-of-measure/update-unit-of-measure.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class UnitOfMeasureValidator extends ValidatorBase<UnitOfMeasure> {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly repo: Repository<UnitOfMeasure>,
    ){ super(repo); }

    public async validateCreate(dto: CreateUnitOfMeasureDto): Promise<ValidationError[]> {

        // name exists
        if(await this.helper.exists(this.repo, 'name', dto.unitName)) { 
            this.addError({
                error: 'Unit of measure with that name already exists.',
                status: 'EXIST',
                contextEntity: 'CreateUnitOfMeasureDto',
                sourceEntity: 'UnitOfMeasure',
                value: dto.unitName,
            } as ValidationError);
        }

        // abbreviation exists
        if(await this.helper.exists(this.repo, 'abbreviation', dto.abbreviation)) { 
            this.addError({
                error: 'Unit of measure with that abbreviation already exists.',
                status: 'EXIST',
                contextEntity: 'CreateUnitOfMeasureDto',
                sourceEntity: 'UnitOfMeasure',
                value: dto.abbreviation,
            } as ValidationError);
        }

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateUnitOfMeasureDto): Promise<ValidationError[]> {

        // name exists
        if(dto.unitName){
            if(await this.helper.exists(this.repo, 'name', dto.unitName)) { 
                this.addError({
                    error: 'Unit of measure with that name already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateUnitOfMeasureDto',
                    contextId: id,
                    sourceEntity: 'UnitOfMeasure',
                    value: dto.unitName,
                } as ValidationError);
            }
        }

        // abbreviation exists
        if(dto.abbreviation){
            if(await this.helper.exists(this.repo, 'abbreviation', dto.abbreviation)) { 
                this.addError({
                    error: 'Unit of measure with that abbreviation already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateUnitOfMeasureDto',
                    contextId: id,
                    sourceEntity: 'UnitOfMeasure',
                    value: dto.abbreviation,
                } as ValidationError);
            }
        }

        return this.errors;
    }
}