import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { Template } from "../entities/template.entity";
import { TemplateService } from "../services/template.service";
import { CreateTemplateDto } from "../dto/create-template.dto";
import { UpdateTemplateDto } from "../dto/update-template.dto";
import { CreateTemplateMenuItemDto } from "../dto/create-template-menu-item.dto";
import { TemplateMenuItemBuilder } from "./template-menu-item.builder";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";

@Injectable()
export class TemplateBuilder extends BuilderBase<Template> {
    constructor(
        private readonly templateService: TemplateService,
        private readonly itemBuilder: TemplateMenuItemBuilder,
    ){ super(Template); }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public isPie(val: boolean): this {
        return this.setProp('isPie', val);
    }

    public itemsByBuilderAfter(templateId: number, dtos: (CreateTemplateMenuItemDto | UpdateTemplateMenuItemDto)[]): this {
        const enrichedDtos = dtos.map(dto => ({
            ...dto,
            templateId
        }));
        return this.setPropAfterBuild(this.itemBuilder.buildManyDto.bind(this.itemBuilder), 'templateItems', this.entity, enrichedDtos)
    }

    public async buildCreateDto(dto: CreateTemplateDto): Promise<Template> {
        this.reset();

        if(dto.isPie){
            this.isPie(dto.isPie);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.itemDtos){
            this.itemsByBuilderAfter(this.entity.id, dto.itemDtos);
        }    
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: Template, dto: UpdateTemplateDto): Promise<Template> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.isPie){
            this.isPie(dto.isPie);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.itemDtos){
            this.itemsByBuilderAfter(this.entity.id, dto.itemDtos);
        }    

        return this.build();
    }
}