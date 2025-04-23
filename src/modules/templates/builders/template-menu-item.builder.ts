import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { TemplateService } from "../services/template.service";
import { CreateTemplateMenuItemDto } from "../dto/create-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";
import { Template } from "../entities/template.entity";
import { TemplateMenuItemService } from "../services/template-menu-item.service";
import { MenuItemService } from "../../menu-items/services/menu-item.service";

@Injectable()
export class TemplateMenuItemBuilder extends BuilderBase<TemplateMenuItem> {
    constructor(
        private readonly templateService: TemplateService,
        private readonly templateItemService: TemplateMenuItemService,

        private menuItemService: MenuItemService,
    ){ super(TemplateMenuItem); }

    public displayName(name: string): this {
        return this.setProp('displayName', name);
    }

    public menuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'menuItem', id);
    }

    public menuItemByName(name: string): this {
        return this.setPropByName(this.menuItemService.findOneByName.bind(this.menuItemService), 'menuItem', name);
    }

    public tablePosIndex(pos: number): this {
        return this.setProp('tablePosIndex', pos);
    }

    public templateById(id: number): this {
        return this.setPropById(this.templateService.findOne.bind(this.templateService), 'template', id);
    }

    public templateByName(name: string): this {
        return this.setPropByName(this.templateService.findOneByName.bind(this.templateService), 'template', name);
    }

    public async buildCreateDto(parentTemplate: Template, dto: CreateTemplateMenuItemDto): Promise<TemplateMenuItem> {
        this.reset();

        if(dto.displayName){
            this.displayName(dto.displayName);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.tablePosIndex !== undefined){ //tablePosIndex value can be 0
            this.tablePosIndex(dto.tablePosIndex);
        }
        if(dto.templateId){
            this.templateById(dto.templateId); // ?
        }
        this.entity.template = parentTemplate; // ?
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: TemplateMenuItem, dto: UpdateTemplateMenuItemDto): Promise<TemplateMenuItem> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.displayName){
            this.displayName(dto.displayName);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.tablePosIndex !== undefined){ //tablePosIndex value can be 0
            this.tablePosIndex(dto.tablePosIndex);
        }
        /*if(dto.templateId){
            this.templateById(dto.templateId);
        }*/

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