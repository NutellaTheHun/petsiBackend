import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemComponentBuilder } from "../builders/menu-item-component.builder";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentValidator } from "../validators/menu-item-component.validator";

@Injectable()
export class MenuItemComponentService extends ServiceBase<MenuItemComponent> {P
    constructor(
        @InjectRepository(MenuItemComponent)
        componentRepo: Repository<MenuItemComponent>,

        @Inject(forwardRef(() => MenuItemComponentBuilder))
        componentBuilder: MenuItemComponentBuilder,

        validator: MenuItemComponentValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(componentRepo, componentBuilder, validator, 'MenuItemComponentService', requestContextService, logger); }
}