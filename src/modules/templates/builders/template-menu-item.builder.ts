import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { TemplateService } from "../services/template.service";
import { CreateTemplateMenuItemDto } from "../dto/create-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";
import { Template } from "../entities/template.entity";
import { TemplateMenuItemService } from "../services/template-menu-item.service";

@Injectable()
export class TemplateMenuItemBuilder extends BuilderBase<TemplateMenuItem> {
    constructor(
        private readonly templateService: TemplateService,
        private readonly templateItemService: TemplateMenuItemService,
    ){ super(TemplateMenuItem); }

    

    public async buildCreateDto(parentTemplate: Template, dto: CreateTemplateMenuItemDto): Promise<TemplateMenuItem> {
        this.reset();

        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: TemplateMenuItem, dto: UpdateTemplateMenuItemDto): Promise<TemplateMenuItem> {
        this.reset();
        this.updateEntity(toUpdate);


        return this.build();
    }

    public async buildManyDto(parentTemplate: Template, dtos: (CreateTemplateMenuItemDto | UpdateTemplateMenuItemDto)[]): Promise<TemplateMenuItem[]> {
        const results: TemplateMenuItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildCreateDto(parentTemplate, dto));
            } else {
                const item = await this.templateItemService.findOne(dto.id);
                if(!item){ throw new Error("recipe ingredient not found"); }
                results.push( await this.buildUpdateDto(item, dto));
            }
        }
        return results;
    }
}