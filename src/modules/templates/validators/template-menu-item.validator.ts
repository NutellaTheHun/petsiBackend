import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateTemplateMenuItemDto } from "../dto/template-menu-item/create-template-menu-item.dto";
import { UpdateChildTemplateMenuItemDto } from "../dto/template-menu-item/update-child-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../dto/template-menu-item/update-template-menu-item.dto";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";

@Injectable()
export class TemplateMenuItemValidator extends ValidatorBase<TemplateMenuItem> {
    constructor(
        @InjectRepository(TemplateMenuItem)
        private readonly repo: Repository<TemplateMenuItem>,
    ) { super(repo); }

    public async validateCreate(dto: CreateTemplateMenuItemDto): Promise<void> {
        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateTemplateMenuItemDto | UpdateChildTemplateMenuItemDto): Promise<void> {
        this.throwIfErrors()
    }
}