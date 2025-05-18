import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { IBuildChildDto } from "../../../base/interfaces/IBuildChildEntity.interface";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateChildComponentOptionDto } from "../dto/child-component-option/create-child-component-option.dto";
import { CreateComponentOptionDto } from "../dto/child-component-option/create-component-option.dto";
import { UpdateChildComponentOptionDto } from "../dto/child-component-option/update-child-component-option.dto";
import { UpdateComponentOptionDto } from "../dto/child-component-option/update-component-option.dto";
import { ComponentOption } from "../entities/component-option.entity";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { ComponentOptionService } from "../services/component-option.service";
import { MenuItemComponentOptionsService } from "../services/menu-item-component-options.service";
import { MenuItemSizeService } from "../services/menu-item-size.service";
import { MenuItemService } from "../services/menu-item.service";
import { ComponentOptionValidator } from "../validators/component-option.validator";

@Injectable()
export class ComponentOptionBuilder extends BuilderBase<ComponentOption> implements IBuildChildDto<MenuItemComponentOptions, ComponentOption> {
    constructor(
        @Inject(forwardRef(() => ComponentOptionService))
        private readonly componentOptionService: ComponentOptionService,

        private readonly itemOptionsSerivce: MenuItemComponentOptionsService,
        private readonly menuItemService: MenuItemService,
        private readonly sizeService: MenuItemSizeService,


        validator: ComponentOptionValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ){ super(ComponentOption, 'MenuItemCategoryBuilder', requestContextService, logger, validator); }

    async buildChildCreateDto(parent: MenuItemComponentOptions, dto: CreateChildComponentOptionDto): Promise<ComponentOption> {
        await this.validateCreateDto(dto);

        this.reset();

        this.entity.parentOption = parent;

        this.buildChildEntity(dto);

        return await this.build();
    }

    buildChildEntity(dto: CreateChildComponentOptionDto): void {
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.validMenuItemId){
            this.validMenuItemById(dto.validMenuItemId);
        }
        if(dto.validSizeIds){
            this.validMenuItemSizeByIds(dto.validSizeIds);
        }
    }

    protected createEntity(dto: CreateComponentOptionDto): void {
        if(dto.parentOptionsId){
            this.parentOptionsById(dto.parentOptionsId);
        }
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.validMenuItemId){
            this.validMenuItemById(dto.validMenuItemId);
        }
        if(dto.validSizeIds){
            this.validMenuItemSizeByIds(dto.validSizeIds);
        }
    }

    protected updateEntity(dto: UpdateComponentOptionDto): void {
        if(dto.quantity){
            this.quantity(dto.quantity);
        }
        if(dto.validMenuItemId){
            this.validMenuItemById(dto.validMenuItemId);
        }
        if(dto.validSizeIds){
            this.validMenuItemSizeByIds(dto.validSizeIds);
        }
    }

    public async buildManyChildDto(parentOption: MenuItemComponentOptions, dtos: (CreateChildComponentOptionDto | UpdateChildComponentOptionDto)[]): Promise<ComponentOption[]> {
        const results: ComponentOption[] = [];
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

    private parentOptionsById(id: number): this {
        return this.setPropById(this.itemOptionsSerivce.findOne.bind(this.itemOptionsSerivce), 'parentOption', id);
    }

    private validMenuItemById(id: number): this {
        return this.setPropById(this.menuItemService.findOne.bind(this.menuItemService), 'validItem', id);
    }

    private validMenuItemSizeByIds(ids: number[]): this {
        return this.setPropsByIds(this.sizeService.findEntitiesById.bind(this.sizeService), 'validSizes', ids);
    }

    private quantity(amount: number): this {
        return this.setPropByVal('validQuantity', amount);
    }
}