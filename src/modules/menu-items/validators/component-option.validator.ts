import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateComponentOptionDto } from "../dto/child-component-option/create-component-option.dto";
import { UpdateComponentOptionDto } from "../dto/child-component-option/update-component-option.dto";
import { ComponentOption } from "../entities/component-option.entity";

@Injectable()
export class ComponentOptionValidator extends ValidatorBase<ComponentOption> {
    constructor(
        @InjectRepository(ComponentOption)
        private readonly repo: Repository<ComponentOption>,
    ){ super(repo); }

    public async validateCreate(dto: CreateComponentOptionDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateComponentOptionDto): Promise<string | null> {
        return null;
    }
}