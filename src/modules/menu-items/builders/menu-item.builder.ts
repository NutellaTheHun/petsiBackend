import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { CreateMenuItemDto } from "../dto/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";

@Injectable()
export class MenuItemBuilder extends BuilderBase<MenuItem>{
    constructor(
        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,

        @Inject(forwardRef(() => MenuItemCategoryService))
        private readonly categoryService: MenuItemCategoryService,

        private readonly sizeService: MenuItemSizeService,
    ){ super(MenuItem); }

    public squareCatalogId(catalogId: string): this {
        return this.setProp('squareCatalogId', catalogId);
    }

    public squareCategoryId(categoryId: string): this {
        return this.setProp('squareCategoryId', categoryId);
    }

    public name(name: string): this {
        return this.setProp('name', name);
    }

    public searchNames(names: string[]): this {
        return this.setProp('searchNames', names);
    }

    public isPOTM(val: boolean): this {
        return this.setProp('isPOTM', val);
    }

    public isParbake(val: boolean): this {
        return this.setProp('isParbake', val);
    }

    public validSizesById(ids: number[]): this {
        return this.setPropsByIds(this.sizeService.findEntitiesById.bind(this.sizeService), 'validSizes', ids);
    }

    public veganOptionById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'veganOption', id);
    }

    public veganOptionByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'veganOption', name);
    }

    public takeNBakeOptionById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'takeNBakeOption', id);
    }

    public takeNBakeByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'takeNBakeOption', name);
    }

    public veganTakeNBakeOptionById(id: number): this {
        return this.setPropById(this.itemService.findOne.bind(this.itemService), 'veganTakeNBakeOption', id);
    }

    public veganTakeNBakeByName(name: string): this {
        return this.setPropByName(this.itemService.findOneByName.bind(this.itemService), 'veganTakeNBakeOption', name);
    }

    public categorybyId(id: number): this {
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categorybyName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    

    public async buildCreateDto(dto: CreateMenuItemDto): Promise<MenuItem> {
        this.reset();

        if(dto.squareCatalogId){
            this.squareCatalogId(dto.squareCatalogId);
        }
        if(dto.squareCategoryId){
            this.squareCategoryId(dto.squareCategoryId);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.searchNames){
            this.searchNames(dto.searchNames);
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
        
        return this.build();
    }

    public async buildUpdateDto(toUpdate: MenuItem, dto: UpdateMenuItemDto): Promise<MenuItem> {
        this.reset();
        this.updateEntity(toUpdate);

        if(dto.squareCatalogId){
            this.squareCatalogId(dto.squareCatalogId);
        }
        if(dto.squareCategoryId){
            this.squareCategoryId(dto.squareCategoryId);
        }
        if(dto.name){
            this.name(dto.name);
        }
        if(dto.searchNames){
            this.searchNames(dto.searchNames);
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

        return this.build();
    }
}