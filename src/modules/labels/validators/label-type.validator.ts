import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { LabelType } from "../entities/label-type.entity";

@Injectable()
export class LabelTypeValidator extends ValidatorBase<LabelType> {
    constructor(
        @InjectRepository(LabelType)
        private readonly repo: Repository<LabelType>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Label type with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}