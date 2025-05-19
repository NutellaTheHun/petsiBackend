import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemContainerRuleBuilder } from "../builders/menu-item-container-rule.builder";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";
import { MenuItemContainerRuleValidator } from "../validators/menu-item-container-rule.validator";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";

@Injectable()
export class MenuItemContainerRuleService extends ServiceBase<MenuItemContainerRule> {
    constructor(
        @InjectRepository(MenuItemContainerRule)
        private readonly repo: Repository<MenuItemContainerRule>,

        @Inject(forwardRef(() => MenuItemContainerRuleBuilder))
        optionBuilder: MenuItemContainerRuleBuilder,

        validator: MenuItemContainerRuleValidator,

        requestContextService: RequestContextService,

        logger: AppLogger,
    ){ super(repo, optionBuilder, validator, 'ComponentOptionService', requestContextService, logger); }

    public async create(dto: CreateMenuItemContainerRuleDto): Promise<MenuItemContainerRule> {
        throw new BadRequestException();
    }
}