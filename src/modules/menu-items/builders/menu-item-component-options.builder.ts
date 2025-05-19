import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildComponentOptionDto } from "../dto/child-component-option/create-child-component-option.dto";
import { CreateChildMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/create-child-menu-item-component-options.dto";
import { CreateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/create-menu-item-component-options.dto";
import { UpdateChildMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/update-child-menu-item-component-options.dto";
import { UpdateMenuItemComponentOptionsDto } from "../dto/menu-item-component-options/update-menu-item-component-options.dto";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemComponentOptionsService } from "../services/menu-item-component-options.service";
import { MenuItemService } from "../services/menu-item.service";
import { MenuItemComponentOptionsValidator } from "../validators/menu-item-component-options.validator";
import { ComponentOptionBuilder } from "./component-option.builder";
import { UpdateChildComponentOptionDto } from "../dto/child-component-option/update-child-component-option.dto";

@Injectable()
export class MenuItemComponentOptionsBuilder extends BuilderBase<MenuItemComponentOptions> implements IBuildChildDto<MenuItem, MenuItemComponentOptions>{
    constructor(
        @Inject(forwardRef(() => MenuItemComponentOptionsService))
        private readonly itemComponentOptionsService: MenuItemComponentOptionsService,

        @Inject(forwardRef(() => MenuItemService))
        private readonly menuItemService: MenuItemService,

        @Inject(forwardRef(() => ComponentOptionBuilder))
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
            this.componentOptionsByBuilder(0, dto.componentOptionDtos);
        }
        if(dto.isDynamic){
            this.isDynamic(dto.isDynamic);
        }
        if(dto.validQuantity){
            this.validQuantity(dto.validQuantity);
        }
    }

    protected createEntity(dto: CreateMenuItemComponentOptionsDto): void {
        if(dto.componentOptionDtos){
            this.componentOptionsByBuilder(0, dto.componentOptionDtos);
        }
        if(dto.containerMenuItemId){
            this.containerById(dto.containerMenuItemId);
        }
        if(dto.isDynamic){
            this.isDynamic(dto.isDynamic);
        }
        if(dto.validQuantity){
            this.validQuantity(dto.validQuantity);
        }
    }

    protected updateEntity(dto: UpdateMenuItemComponentOptionsDto): void {
        if(dto.componentOptionDtos){
            this.componentOptionsByBuilder(0, dto.componentOptionDtos);
        }
        if(dto.isDynamic !== undefined){
            this.isDynamic(dto.isDynamic);
        }
        if(dto.validQuantity){
            this.validQuantity(dto.validQuantity);
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

    componentOptionsByBuilder(optionsId: number, dtos: (CreateChildComponentOptionDto | UpdateChildComponentOptionDto)[]): this {
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