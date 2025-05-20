import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-child-menu-item-container-options.dto";
import { UpdateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-child-menu-item-container-options.dto";
import { CreateChildMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-child-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemValidator } from "../validators/menu-item.validator";
import { MenuItemContainerOptionsBuilder } from "./menu-item-container-options.builder";
import { MenuItemContainerItemBuilder } from "./menu-item-container-item.builder";

@Injectable()
export class MenuItemBuilder extends BuilderBase<MenuItem>{
    constructor(
        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,

        @Inject(forwardRef(() => MenuItemCategoryService))
        private readonly categoryService: MenuItemCategoryService,

        @Inject(forwardRef(() => MenuItemContainerItemBuilder))
        private readonly componentBuilder: MenuItemContainerItemBuilder,

        private readonly sizeService: MenuItemSizeService,

        @Inject(forwardRef(() => MenuItemContainerOptionsBuilder))
        private readonly componentOptionsBuilder: MenuItemContainerOptionsBuilder,
        
        validator: MenuItemValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(MenuItem, 'MenuItemBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateMenuItemDto): void {
        if(dto.itemName !== undefined){
            this.name(dto.itemName);
        }
        if(dto.isPOTM !== undefined){
            this.isPOTM(dto.isPOTM);
        }
        if(dto.isParbake !== undefined){
            this.isParbake(dto.isParbake);
        }

        // Entities
        if(dto.validSizeIds !== undefined){
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
        if(dto.definedContainerItemDtos !== undefined){
            this.definedContainerItemsByBuilder(this.entity.id, dto.definedContainerItemDtos);
        }
        if(dto.containerOptionDto !== undefined){
            this.containerOptionsByBuilder(this.entity.id, dto.containerOptionDto);
        }
    }

    protected updateEntity(dto: UpdateMenuItemDto): void {
        if(dto.itemName !== undefined){
            this.name(dto.itemName);
        }
        if(dto.isPOTM !== undefined){
            this.isPOTM(dto.isPOTM);
        }
        if(dto.isParbake !== undefined){
            this.isParbake(dto.isParbake);
        }

        // Entities
        if(dto.validSizeIds !== undefined){
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
        if(dto.definedContainerItemDtos !== undefined){
            this.definedContainerItemsByBuilder(this.entity.id, dto.definedContainerItemDtos);
        }
        if(dto.containerOptionDto !== undefined){
            this.containerOptionsByBuilder(this.entity.id, dto.containerOptionDto);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('itemName', name);
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

    public veganOptionById(id: number | null): this {
        if(id === null){
            return this.setPropByVal('veganOption', null);
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'veganOption', id);
    }

    public veganOptionByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'veganOption', name);
    }

    public takeNBakeOptionById(id: number | null): this {
        if(id === null){
            return this.setPropByVal('takeNBakeOption', null);
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'takeNBakeOption', id);
    }

    public takeNBakeByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'takeNBakeOption', name);
    }

    public veganTakeNBakeOptionById(id: number | null): this {
        if(id === null){
            return this.setPropByVal('veganTakeNBakeOption', null);
        }
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'veganTakeNBakeOption', id);
    }

    public veganTakeNBakeByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'veganTakeNBakeOption', name);
    }

    public categorybyId(id: number | null): this {
        if(id === null){
            return this.setPropByVal('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categorybyName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public definedContainerItemsByBuilder(parentId: number, dtos: (CreateChildMenuItemContainerItemDto | UpdateMenuItemContainerItemDto)[] | null): this {
        if(dtos === null){
            return this.setPropByVal('definedContainerItems', []);
        }
        const enrichedDtos = dtos.map( dto => ({
            ...dto,
            containerId: parentId,
        }));
        return this.setPropByBuilder(this.componentBuilder.buildManyChildDto.bind(this.componentBuilder), 'definedContainerItems', this.entity, enrichedDtos);
    }

    public containerOptionsByBuilder(parentId: number, dto: (CreateChildMenuItemContainerOptionsDto | UpdateChildMenuItemContainerOptionsDto) | null): this {
        if(dto === null){
            return this.setPropByVal('containerOptions', null);
        }
        return this.setPropByBuilder(this.componentOptionsBuilder.buildChildDto.bind(this.componentOptionsBuilder), 'containerOptions', this.entity, dto);
    }
}