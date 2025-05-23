import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServiceBase } from "../../../base/service-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemContainerRuleBuilder } from "../builders/menu-item-container-rule.builder";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";

@Injectable()
export class MenuItemContainerRuleService extends ServiceBase<MenuItemContainerRule> {
    constructor(
        @InjectRepository(MenuItemContainerRule)
        repo: Repository<MenuItemContainerRule>,

        @Inject(forwardRef(() => MenuItemContainerRuleBuilder))
        builder: MenuItemContainerRuleBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'ComponentOptionService', requestContextService, logger); }

    /**
     * Depreciated, only created as a child through {@link MenuItemContainerOptions}.
     */
    public async create(dto: CreateMenuItemContainerRuleDto): Promise<MenuItemContainerRule> {
        throw new BadRequestException();
    }
}