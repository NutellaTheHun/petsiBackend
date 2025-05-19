import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateTemplateDto } from "../dto/template/create-template.dto";
import { UpdateTemplateDto } from "../dto/template/update-template.dto";
import { Template } from "../entities/template.entity";

@Injectable()
export class TemplateValidator extends ValidatorBase<Template> {
    constructor(
        @InjectRepository(Template)
        private readonly repo: Repository<Template>,
    ){ super(repo); }

    public async validateCreate(dto: CreateTemplateDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Template with name ${dto.name} already exists`; 
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateTemplateDto): Promise<string | null> {
        return null;
    }
}