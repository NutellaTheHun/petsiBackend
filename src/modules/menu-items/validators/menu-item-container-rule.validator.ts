import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validationError";
import { CreateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-child-menu-item-container-rule.dto";
import { UpdateChildMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-child-menu-item-container-rule.dto";
import { UpdateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-menu-item-container-rule.dto";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";
import { MenuItemService } from "../services/menu-item.service";

@Injectable()
export class MenuItemContainerRuleValidator extends ValidatorBase<MenuItemContainerRule> {
    constructor(
        @InjectRepository(MenuItemContainerRule)
        private readonly repo: Repository<MenuItemContainerRule>,
        
        @Inject(forwardRef(() => MenuItemService))
        private readonly itemService: MenuItemService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildMenuItemContainerRuleDto): Promise<ValidationError[]> {

        // No sizes
        if(dto.validSizeIds.length === 0){
            this.addError({
                error: 'Menu item container setting has no sizes selected.',
                status: 'INVALID',
                contextEntity: 'CreateMenuItemContainerRuleDto',
                sourceEntity: 'MenuItemSize',
            } as ValidationError);
        }

        // valid sizes
        const item = await this.itemService.findOne(dto.validMenuItemId, ['validSizes']);
        if(!item){ throw new Error('item not found'); }

        for(const scarySizeId of dto.validSizeIds){
            if(!this.helper.isValidSize(scarySizeId, item.validSizes)){
                this.addError({
                    error: 'Invalid size for item',
                    status: 'INVALID',
                    contextEntity: 'CreateMenuItemContainerRuleDto',
                    sourceEntity: 'MenuItemSize',
                    sourceId: scarySizeId,
                    conflictEntity: 'MenuItem',
                    conflictId: item.id,
                } as ValidationError);
            }
        }

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerRuleDto | UpdateChildMenuItemContainerRuleDto): Promise<ValidationError[]> {
        
        // No sizes
        if(dto.validSizeIds?.length === 0){
           this.addError({
                error: 'Menu item container setting has no sizes selected.',
                status: 'INVALID',
                contextEntity: 'UpdateMenuItemContainerRuleDto',
                sourceEntity: 'MenuItemSize',
            } as ValidationError);
        }

        // validate sizes
        if(dto.validMenuItemId || dto.validSizeIds){
            const currentRule = await this.repo.findOne({ where: { id }, relations: ['validItem', 'validSizes']});
            if(!currentRule){ throw new Error(); }

            const sizeIds = dto.validSizeIds ?? currentRule?.validSizes.map(size => size.id);
            const itemId = dto.validMenuItemId ?? currentRule?.validItem.id;

            const item = await this.itemService.findOne(itemId, ['validSizes']);
            if(!item){ throw new Error('item not found'); }

            for(const scarySize of sizeIds){
                if(!this.helper.isValidSize(scarySize, item.validSizes)){
                   this.addError({
                        error: 'Invalid size for item',
                        status: 'INVALID',
                        contextEntity: 'CreateMenuItemContainerRuleDto',
                        contextId: id,
                        sourceEntity: 'MenuItemSize',
                        sourceId: id,
                        conflictEntity: 'MenuItem',
                        conflictId: item.id,
                    } as ValidationError);
                }
            }
        }
        
        return this.errors;
    }
}