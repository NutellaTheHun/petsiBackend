import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemCategoryValidator } from "../validators/menu-item-category.validator";

@Injectable()
export class MenuItemCategoryBuilder extends BuilderBase<MenuItemCategory> {
    constructor(
        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,

        validator: MenuItemCategoryValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ) { super(MenuItemCategory, 'MenuItemCategoryBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateMenuItemCategoryDto): void {
        if (dto.categoryName !== undefined) {
            this.name(dto.categoryName);
        }
    }

    protected updateEntity(dto: UpdateMenuItemCategoryDto): void {
        if (dto.categoryName !== undefined) {
            this.name(dto.categoryName);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('categoryName', name);
    }

    public menuItemsById(ids: number[]): this {
        return this.setPropsByIds(this.itemService.findEntitiesById.bind(this.itemService), 'categoryItems', ids);
    }
}