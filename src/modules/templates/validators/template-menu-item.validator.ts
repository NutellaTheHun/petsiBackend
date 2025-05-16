import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { CreateTemplateMenuItemDto } from "../dto/create-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";

@Injectable()
export class TemplateMenuItemValidator extends ValidatorBase<TemplateMenuItem> {
    constructor(
        @InjectRepository(TemplateMenuItem)
        private readonly repo: Repository<TemplateMenuItem>,
    ){ super(repo); }

    public async validateCreate(dto: CreateTemplateMenuItemDto): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: UpdateTemplateMenuItemDto): Promise<string | null> {
        return null;
    }
}