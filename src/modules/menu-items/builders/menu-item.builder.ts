import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateChildMenuItemComponentDto } from "../dto/create-child-menu-item-component.dto";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { UpdateMenuItemDto } from "../dto/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemValidator } from "../validators/menu-item.validator";
import { MenuItemComponentBuilder } from "./menu-item-component.builder";

@Injectable()
export class MenuItemBuilder extends BuilderBase<MenuItem>{
    constructor(
        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,

        @Inject(forwardRef(() => MenuItemCategoryService))
        private readonly categoryService: MenuItemCategoryService,

        @Inject(forwardRef(() => MenuItemComponentBuilder))
        private readonly componentBuilder: MenuItemComponentBuilder,

        private readonly sizeService: MenuItemSizeService,
        
        validator: MenuItemValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(MenuItem, 'MenuItemBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateMenuItemDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.isPOTM){
            this.isPOTM(dto.isPOTM);
        }
        if(dto.isParbake){
            this.isParbake(dto.isParbake);
        }

        // Entities
        if(dto.validSizeIds){
            this.validSizesById(dto.validSizeIds);
        }
        if(dto.veganOptionMenuId){
            this.veganOptionById(dto.veganOptionMenuId);
        }
        if(dto.takeNBakeOptionMenuId){
            this.takeNBakeOptionById(dto.takeNBakeOptionMenuId);
        }
        if(dto.veganTakeNBakeOptionMenuId){
            this.veganTakeNBakeOptionById(dto.veganTakeNBakeOptionMenuId);
        }
        if(dto.categoryId){
            this.categorybyId(dto.categoryId);
        }
        if(dto.containerComponentDtos){
            this.containerByBuilder(this.entity.id, dto.containerComponentDtos);
        }
    }

    protected updateEntity(dto: UpdateMenuItemDto): void {
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.isPOTM){
            this.isPOTM(dto.isPOTM);
        }
        if(dto.isParbake){
            this.isParbake(dto.isParbake);
        }

        // Entities
        if(dto.validSizeIds){
            this.validSizesById(dto.validSizeIds);
        }
        if(dto.veganOptionMenuId !== undefined){
            this.veganOptionById(dto.veganOptionMenuId);
        }
        if(dto.takeNBakeOptionMenuId !== undefined){
            this.takeNBakeOptionById(dto.takeNBakeOptionMenuId);
        }
        if(dto.veganTakeNBakeOptionMenuId !== undefined){
            this.veganTakeNBakeOptionById(dto.veganTakeNBakeOptionMenuId);
        }
        if(dto.categoryId !== undefined){
            this.categorybyId(dto.categoryId);
        }
        if(dto.containerComponentDtos){
            this.containerByBuilder(this.entity.id, dto.containerComponentDtos);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public isPOTM(val: boolean): this {
        return this.setPropByVal('isPOTM', val);
    }

    public isParbake(val: boolean): this {
        return this.setPropByVal('isParbake', val);
    }

    public validSizesById(ids: number[]): this {
        return this.setPropsByIds(this.sizeService.findEntitiesById.bind(this.sizeService), 'validSizes', ids);
    }

    public veganOptionById(id: number): this {
        if(id === 0){
            return this.setPropByVal('veganOption', null);
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'veganOption', id);
    }

    public veganOptionByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'veganOption', name);
    }

    public takeNBakeOptionById(id: number): this {
        if(id === 0){
            return this.setPropByVal('takeNBakeOption', null)
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'takeNBakeOption', id);
    }

    public takeNBakeByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'takeNBakeOption', name);
    }

    public veganTakeNBakeOptionById(id: number): this {
        if(id === 0){
            return this.setPropByVal('veganTakeNBakeOption', null);
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'veganTakeNBakeOption', id);
    }

    public veganTakeNBakeByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'veganTakeNBakeOption', name);
    }

    public categorybyId(id: number): this {
        if(id === 0){
            return this.setPropByVal('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categorybyName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public containerByBuilder(containerId: number, dtos: (CreateChildMenuItemComponentDto | UpdateMenuItemComponentDto)[]): this {
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            containerId,
        }));
        return this.setPropByBuilder(this.componentBuilder.buildManyChildDto.bind(this.componentBuilder), 'container', this.entity, enrichedDtos);
    }
}