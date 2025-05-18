import { Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeValidator } from "../validators/menu-item-size.validator";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";

@Injectable()
export class MenuItemSizeBuilder extends BuilderBase<MenuItemSize> {
    constructor(
        validator: MenuItemSizeValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(MenuItemSize, 'MenuItemSizeBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateMenuItemSizeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    protected updateEntity(dto: UpdateMenuItemSizeDto): void {
        if(dto.name){
            this.name(dto.name);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }
}