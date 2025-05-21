import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemContainerItemBuilder } from "../builders/menu-item-container-item.builder";
import { MenuItemContainerItem } from "../entities/menu-item-container-item.entity";
import { MenuItemContainerItemValidator } from "../validators/menu-item-container-item.validator";
import { CreateMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-menu-item-container-item.dto";
import { MenuItem } from "../entities/menu-item.entity";

@Injectable()
export class MenuItemContainerItemService extends ServiceBase<MenuItemContainerItem> {P
    constructor(
        @InjectRepository(MenuItemContainerItem)
        componentRepo: Repository<MenuItemContainerItem>,

        @Inject(forwardRef(() => MenuItemContainerItemBuilder))
        componentBuilder: MenuItemContainerItemBuilder,

        @Inject(forwardRef(() => MenuItemContainerItemValidator))
        validator: MenuItemContainerItemValidator,
        
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(componentRepo, componentBuilder, validator, 'MenuItemComponentService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link MenuItem}.
     */
    public async create(dto: CreateMenuItemContainerItemDto): Promise<MenuItemContainerItem> {
        throw new BadRequestException();
    }
}