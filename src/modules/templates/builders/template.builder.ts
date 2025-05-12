import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateChildTemplateMenuItemDto } from "../dto/create-child-template-menu-item.dto";
import { CreateTemplateDto } from "../dto/create-template.dto";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";
import { UpdateTemplateDto } from "../dto/update-template.dto";
import { Template } from "../entities/template.entity";
import { TemplateValidator } from "../validators/template.validator";
import { TemplateMenuItemBuilder } from "./template-menu-item.builder";

@Injectable()
export class TemplateBuilder extends BuilderBase<Template> {
    constructor(
        @Inject(forwardRef(() => TemplateMenuItemBuilder))
        private readonly itemBuilder: TemplateMenuItemBuilder,
        validator: TemplateValidator,
    ){ super(Template, validator); }

    protected async createEntity(dto: CreateTemplateDto): Promise<void> {
        if(dto.isPie){
            this.isPie(dto.isPie);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.itemDtos){
            this.itemsByBuilder(this.entity.id, dto.itemDtos);
        } 
    }

    protected async updateEntity(dto: UpdateTemplateDto): Promise<void> {
        if(dto.isPie){
            this.isPie(dto.isPie);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.itemDtos){
            this.itemsByBuilder(this.entity.id, dto.itemDtos);
        } 
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public isPie(val: boolean): this {
        return this.setProp('isPie', val);
    }

    public itemsByBuilder(templateId: number, dtos: (CreateChildTemplateMenuItemDto | UpdateTemplateMenuItemDto)[]): this {
        const enrichedDtos = dtos.map(dto => ({
            ...dto,
            templateId
        }));
        return this.setPropByBuilder(this.itemBuilder.buildManyDto.bind(this.itemBuilder), 'templateItems', this.entity, enrichedDtos)
    }
}