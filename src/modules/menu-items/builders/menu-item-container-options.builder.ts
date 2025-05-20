import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { CreateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-child-menu-item-container-options.dto";
import { CreateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-menu-item-container-options.dto";
import { UpdateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-child-menu-item-container-options.dto";
import { UpdateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-menu-item-container-options.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemContainerOptionsService } from "../services/menu-item-container-options.service";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemContainerOptionsValidator } from "../validators/menu-item-container-options.validator";
import { MenuItemContainerRuleBuilder } from "./menu-item-container-rule.builder";
import { UpdateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-child-menu-item-container-rule.dto";

@Injectable()
export class MenuItemContainerOptionsBuilder extends BuilderBase<MenuItemContainerOptions> implements IBuildChildDto<MenuItem, MenuItemContainerOptions>{
    constructor(
        @Inject(forwardRef(() => MenuItemContainerOptionsService))
        private readonly itemComponentOptionsService: MenuItemContainerOptionsService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly menuItemService: MenuItemService,

        @Inject(forwardRef(() => MenuItemContainerRuleBuilder))
        private readonly componentOptionBuilder: MenuItemContainerRuleBuilder,

        validator: MenuItemContainerOptionsValidator,

        requestContextService: RequestContextService,
        
        logger: AppLogger,
    ){ super(MenuItemContainerOptions, 'MenuItemComponentOptionsBuilder', requestContextService, logger, validator); }

    async buildChildCreateDto(parentItem: MenuItem, dto: CreateChildMenuItemContainerOptionsDto): Promise<MenuItemContainerOptions> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentContainer = parentItem;

        this.buildChildEntity(dto);

        return await this.build();
    }
    
    buildChildEntity(dto: CreateChildMenuItemContainerOptionsDto): void {
        if(dto.containerRuleDtos !== undefined){
            this.containerRulesByBuilder(0, dto.containerRuleDtos);
        }
        if(dto.validQuantity !== undefined){
            this.validQuantity(dto.validQuantity);
        }
    }

    /**
     * Depreciated, only created as a child through {@link MenuItem}.
     */
    protected createEntity(dto: CreateMenuItemContainerOptionsDto): void {
        if(dto.containerRuleDtos !== undefined){
            this.containerRulesByBuilder(0, dto.containerRuleDtos);
        }
        if(dto.parentContainerMenuItemId !== undefined){
            this.parentContainerById(dto.parentContainerMenuItemId);
        }
        if(dto.validQuantity !== undefined){
            this.validQuantity(dto.validQuantity);
        }
    }

    protected updateEntity(dto: UpdateMenuItemContainerOptionsDto): void {
        if(dto.containerRuleDtos !== undefined){
            this.containerRulesByBuilder(0, dto.containerRuleDtos);
        }
        if(dto.validQuantity !== undefined){
            this.validQuantity(dto.validQuantity);
        }
    }

    public async buildChildDto(parentItem: MenuItem, dto: (CreateChildMenuItemContainerOptionsDto | UpdateChildMenuItemContainerOptionsDto)): Promise<MenuItemContainerOptions> {
        if(dto.mode === 'create'){
            return await this.buildChildCreateDto(parentItem, dto);
        }
        const toUpdate = await this.itemComponentOptionsService.findOne(dto.id);
        if(!toUpdate){ throw new Error("options is null"); }

        return await this.buildUpdateDto(toUpdate, dto);
    }

    public containerRulesByBuilder(optionsId: number, dtos: (CreateChildMenuItemContainerRuleDto | UpdateChildMenuItemContainerRuleDto)[]): this {
        return this.setPropByBuilder(this.componentOptionBuilder.buildManyChildDto.bind(this.componentOptionBuilder), 'containerRules', this.entity, dtos)
    }

    public validQuantity(amount: number): this {
        return this.setPropByVal('validQuantity', amount);
    }

    public parentContainerById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'parentContainer', id);
    }
}