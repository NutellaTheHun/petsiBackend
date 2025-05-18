import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemComponentOptionsBuilder } from "../builders/menu-item-component-options.builder";
import { CreateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/create-menu-item-component-options.dto";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { MenuItemComponentOptionsValidator } from "../validators/menu-item-component-options.validator";

@Injectable()
export class MenuItemComponentOptionsService extends ServiceBase<MenuItemComponentOptions> {
    constructor(
        @InjectRepository(MenuItemComponentOptions)
        optionsRepo: Repository<MenuItemComponentOptions>,

        @Inject(forwardRef(() => MenuItemComponentOptionsBuilder))
        optionsBuilder: MenuItemComponentOptionsBuilder,

        validator: MenuItemComponentOptionsValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(optionsRepo, optionsBuilder, validator, 'MenuItemComponentOptionsService', requestContextService, logger); }

    public async create(dto: CreateMenuItemComponentOptionsDto): Promise<MenuItemComponentOptions> {
        throw new BadRequestException();
    }
}