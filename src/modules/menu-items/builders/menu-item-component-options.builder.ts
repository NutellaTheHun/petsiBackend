import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { CreateMenuItemCategoryDto } from "../dto/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/update-menu-item-category.dto";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemCategoryValidator } from "../validators/menu-item-category.validator";
import { MenuItem } from "../entities/menu-item.entity";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { CreateChildMenuItemComponentOptionsDto } from "../dto/create-child-menu-item-component-options.dto";
import { UpdateChildMenuItemComponentOptionsDto } from "../dto/update-child-menu-item-component-options.dto";
import { CreateMenuItemComponentOptionsDto } from "../dto/create-menu-item-component-options.dto";
import { UpdateMenuItemComponentOptionsDto } from "../dto/update-menu-item-component-options.dto";
import { CreateChildComponentOptionDto } from "../dto/create-child-component-option.dto";
import { ComponentOptionBuilder } from "./component-option.builder";
import { MenuItemComponentOptionsService } from "../services/menu-item-component-options.service";
import { MenuItemComponentOptionsValidator } from "../validators/menu-item-component-options.validator";

@Injectable()
export class MenuItemComponentOptionsBuilder extends BuilderBase<MenuItemComponentOptions> implements IBuildChildDto<MenuItem, MenuItemComponentOptions>{
    constructor(
        @Inject(forwardRef(() => MenuItemComponentOptionsService))
        private readonly itemComponentOptionsService: MenuItemComponentOptionsService,

        private readonly menuItemService: MenuItemService,
        private readonly componentOptionBuilder: ComponentOptionBuilder,

        validator: MenuItemComponentOptionsValidator,

        requestContextService: RequestContextService,
        
        logger: AppLogger,
    ){ super(MenuItemComponentOptions, 'MenuItemComponentOptionsBuilder', requestContextService, logger, validator); }

    async buildChildCreateDto(parentItem: MenuItem, dto: CreateChildMenuItemComponentOptionsDto): Promise<MenuItemComponentOptions> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.container = parentItem;

        this.buildChildEntity(dto);

        return await this.build();
    }
    
    buildChildEntity(dto: CreateChildMenuItemComponentOptionsDto): void {
        if(dto.componentOptionDtos){

        }
        if(dto.isDynamic){

        }
        if(dto.validQuantity){

        }
    }

    protected createEntity(dto: CreateMenuItemComponentOptionsDto): void {
        if(dto.componentOptionDtos){

        }
        if(dto.containerMenuItemId){

        }
        if(dto.isDynamic){

        }
        if(dto.validQuantity){

        }
    }

    protected updateEntity(dto: UpdateMenuItemComponentOptionsDto): void {
        if(dto.componentOptionDtos){

        }
        if(dto.isDynamic){

        }
        if(dto.validQuantity){

        }
    }

    public async buildChildDto(parentItem: MenuItem, dto: (CreateChildMenuItemComponentOptionsDto | UpdateChildMenuItemComponentOptionsDto)): Promise<MenuItemComponentOptions> {
        if(dto.mode === 'create'){
            return await this.buildChildCreateDto(parentItem, dto);
        }
        const toUpdate = await this.itemComponentOptionsService.findOne(dto.id);
        if(!toUpdate){ throw new Error("options is null"); }

        return await this.buildUpdateDto(toUpdate, dto);
    }

    componentOptionsByBuilder(optionsId: number, dtos: CreateChildComponentOptionDto): this {
        return this.setPropByBuilder(this.componentOptionBuilder.buildManyChildDto.bind(this.componentOptionBuilder), 'validComponents', this.entity, dtos)
    }

    isDynamic(val: boolean): this {
        return this.setPropByVal('isDynamic', val);
    }

    validQuantity(amount: number): this {
        return this.setPropByVal('validQuantity', amount);
    }

    containerById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'container', id);
    }
}