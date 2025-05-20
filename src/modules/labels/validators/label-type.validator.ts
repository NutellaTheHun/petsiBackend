import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { LabelType } from "../entities/label-type.entity";
import { CreateLabelTypeDto } from "../dto/label-type/create-label-type.dto";
import { UpdateLabelTypeDto } from "../dto/label-type/update-label-type.dto";

@Injectable()
export class LabelTypeValidator extends ValidatorBase<LabelType> {
    constructor(
        @InjectRepository(LabelType)
        private readonly repo: Repository<LabelType>,
    ){ super(repo); }

    public async validateCreate(dto: CreateLabelTypeDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { labelTypeName: dto.labelTypeName }});
        if(exists) { 
            return `Label type with name ${dto.labelTypeName} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateLabelTypeDto): Promise<string | null> {
        if(dto.labelTypeName){
            const exists = await this.repo.findOne({ where: { labelTypeName: dto.labelTypeName }});
        if(exists) { 
            return `Label type with name ${dto.labelTypeName} already exists`; 
        }
        }
        return null;
    }
}