import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemComponentOptionsBuilder } from "../builders/menu-item-component-options.builder";
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
}