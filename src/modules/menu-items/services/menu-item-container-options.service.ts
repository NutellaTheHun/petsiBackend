import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemContainerOptionsBuilder } from "../builders/menu-item-container-options.builder";
import { CreateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-menu-item-container-options.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItemContainerOptionsValidator } from "../validators/menu-item-container-options.validator";
import { MenuItem } from "../entities/menu-item.entity";

@Injectable()
export class MenuItemContainerOptionsService extends ServiceBase<MenuItemContainerOptions> {
    constructor(
        @InjectRepository(MenuItemContainerOptions)
        optionsRepo: Repository<MenuItemContainerOptions>,

        @Inject(forwardRef(() => MenuItemContainerOptionsBuilder))
        optionsBuilder: MenuItemContainerOptionsBuilder,

        validator: MenuItemContainerOptionsValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(optionsRepo, optionsBuilder, validator, 'MenuItemComponentOptionsService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link MenuItem}.
     */
    public async create(dto: CreateMenuItemContainerOptionsDto): Promise<MenuItemContainerOptions> {
        throw new BadRequestException();
    }
}