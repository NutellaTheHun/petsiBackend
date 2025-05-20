import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";
import { UpdateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-child-menu-item-container-rule.dto";
import { UpdateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-menu-item-container-rule.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";
import { MenuItemContainerOptionsService } from "../services/menu-item-container-options.service";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemContainerRuleValidator } from "../validators/menu-item-container-rule.validator";
@Injectable()
export class MenuItemContainerRuleBuilder extends BuilderBase<MenuItemContainerRule> implements IBuildChildDto<MenuItemContainerOptions, MenuItemContainerRule> {
    constructor(
        @Inject(forwardRef(() => MenuItemContainerRuleService))
        private readonly componentOptionService: MenuItemContainerRuleService,

        @Inject(forwardRef(() => MenuItemContainerOptionsService))
        private readonly itemOptionsSerivce: MenuItemContainerOptionsService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly menuItemService: MenuItemService,

        private readonly sizeService: MenuItemSizeService,


        validator: MenuItemContainerRuleValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(MenuItemContainerRule, 'MenuItemCategoryBuilder', requestContextService, logger, validator); }

    async buildChildCreateDto(parent: MenuItemContainerOptions, dto: CreateChildMenuItemContainerRuleDto): Promise<MenuItemContainerRule> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentContainerOption = parent;

        this.buildChildEntity(dto);

        return await this.build();
    }

    buildChildEntity(dto: CreateChildMenuItemContainerRuleDto): void {
        if(dto.validMenuItemId !== undefined){
            this.validMenuItemById(dto.validMenuItemId);
        }
        if(dto.validSizeIds !== undefined){
            this.validMenuItemSizeByIds(dto.validSizeIds);
        }
    }

    /**
     * Depreciated, only created as a child through {@link MenuItemContainerOptions}.
     */
    protected createEntity(dto: CreateMenuItemContainerRuleDto): void {
        if(dto.parentContainerOptionsId !== undefined){
            this.parentContainerOptionsById(dto.parentContainerOptionsId);
        }
        if(dto.validMenuItemId !== undefined){
            this.validMenuItemById(dto.validMenuItemId);
        }
        if(dto.validSizeIds !== undefined){
            this.validMenuItemSizeByIds(dto.validSizeIds);
        }
    }

    protected updateEntity(dto: UpdateMenuItemContainerRuleDto): void {
        if(dto.validMenuItemId !== undefined){
            this.validMenuItemById(dto.validMenuItemId);
        }
        if(dto.validSizeIds !== undefined){
            this.validMenuItemSizeByIds(dto.validSizeIds);
        }
    }

    public async buildManyChildDto(parentOption: MenuItemContainerOptions, dtos: (CreateChildMenuItemContainerRuleDto | UpdateChildMenuItemContainerRuleDto)[]): Promise<MenuItemContainerRule[]> {
        const results: MenuItemContainerRule[] = [];
        for(const dto of dtos){
            if(dto.mode === 'create'){
                results.push(await this.buildChildCreateDto(parentOption, dto));
            } else {
                const toUpdate = await this.componentOptionService.findOne(dto.id);
                if(!toUpdate){ throw Error("component option is null"); }
                results.push(await this.buildUpdateDto(toUpdate, dto))
            }
        }
        return results;
    }

    private parentContainerOptionsById(id: number): this {
        return this.setPropById(this.itemOptionsSerivce.findOne.bind(this.itemOptionsSerivce), 'parentContainerOption', id);
    }

    private validMenuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'validItem', id);
    }

    private validMenuItemSizeByIds(ids: number[]): this {
        return this.setPropsByIds(this.sizeService.findEntitiesById.bind(this.sizeService), 'validSizes', ids);
    }
}