import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Template } from "../entities/template.entity";

@Injectable()
export class TemplateValidator extends ValidatorBase<Template> {
    constructor(
        @InjectRepository(Template)
        private readonly repo: Repository<Template>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}