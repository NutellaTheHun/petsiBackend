import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { MenuItemService } from "../../menu-items/services/menu-item.service";
import { CreateChildTemplateMenuItemDto } from "../dto/create-child-template-menu-item.dto";
import { CreateTemplateMenuItemDto } from "../dto/create-template-menu-item.dto";
import { UpdateChildTemplateMenuItemDto } from "../dto/update-child-template-menu-item.dto";
import { UpdateTemplateMenuItemDto } from "../dto/update-template-menu-item.dto";
import { TemplateMenuItem } from "../entities/template-menu-item.entity";
import { Template } from "../entities/template.entity";
import { TemplateMenuItemService } from "../services/template-menu-item.service";
import { TemplateService } from "../services/template.service";
import { TemplateMenuItemValidator } from "../validators/template-menu-item.validator";

@Injectable()
export class TemplateMenuItemBuilder extends BuilderBase<TemplateMenuItem> implements IBuildChildDto<Template, TemplateMenuItem>{
    constructor(
        @Inject(forwardRef(() => TemplateService))
        private readonly templateService: TemplateService,
        @Inject(forwardRef(() => TemplateMenuItemService))
        private readonly templateItemService: TemplateMenuItemService,

        private menuItemService: MenuItemService,
        validator: TemplateMenuItemValidator,
    ){ super(TemplateMenuItem, validator); }

    protected async createEntity(dto: CreateTemplateMenuItemDto): Promise<void> {
        if(dto.templateId){
            this.templateById(dto.templateId);
        }
        if(dto.displayName){
            this.displayName(dto.displayName);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.tablePosIndex !== undefined){ //tablePosIndex value can be 0
            this.tablePosIndex(dto.tablePosIndex);
        }
    }

    protected async updateEntity(dto: UpdateTemplateMenuItemDto): Promise<void> {
        if(dto.displayName){
            this.displayName(dto.displayName);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.tablePosIndex !== undefined){ //tablePosIndex value can be 0
            this.tablePosIndex(dto.tablePosIndex);
        }
    }
    
    async buildChildEntity(dto: CreateChildTemplateMenuItemDto): Promise<void> {
        if(dto.displayName){
            this.displayName(dto.displayName);
        }
        if(dto.menuItemId){
            this.menuItemById(dto.menuItemId);
        }
        if(dto.tablePosIndex !== undefined){ //tablePosIndex value can be 0
            this.tablePosIndex(dto.tablePosIndex);
        }
    }

    async buildChildCreateDto(parent: Template, dto: CreateChildTemplateMenuItemDto): Promise<TemplateMenuItem> {
        await this.validateCreateDto(dto);
        this.reset();

        this.entity.template = parent;

        await this.buildChildEntity(dto);

        return await this.build();
    }

    public async buildManyDto(parentTemplate: Template, dtos: (CreateChildTemplateMenuItemDto | UpdateChildTemplateMenuItemDto)[]): Promise<TemplateMenuItem[]> {
        const results: TemplateMenuItem[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push( await this.buildChildCreateDto(parentTemplate, dto));
            } else {
                const item = await this.templateItemService.findOne(dto.id);
                if(!item){ throw new Error("recipe ingredient not found"); }
                results.push( await this.buildUpdateDto(item, dto));
            }
        }
        return results;
    }

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
}