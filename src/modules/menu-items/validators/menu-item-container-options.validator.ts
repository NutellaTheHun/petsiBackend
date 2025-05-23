import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-child-menu-item-container-options.dto";
import { UpdateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-child-menu-item-container-options.dto";
import { UpdateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-menu-item-container-options.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class MenuItemContainerOptionsValidator extends ValidatorBase<MenuItemContainerOptions> {
    constructor(
        @InjectRepository(MenuItemContainerOptions)
        private readonly repo: Repository<MenuItemContainerOptions>,
        
        @Inject(forwardRef(() => MenuItemContainerRuleService))
        private readonly ruleService: MenuItemContainerRuleService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildMenuItemContainerOptionsDto): Promise<ValidationError[]> {

        // No rules
        if(dto.containerRuleDtos.length === 0){
            this.addError({
                error: 'Menu item container has no settings.',
                status: 'INVALID',
                contextEntity: 'CreateMenuItemContainerOptionsDto',
                sourceEntity: 'MenuItemContainerRule',
            } as ValidationError);
        }

        // duplicate item rules
        const dupliateItemRules = this.helper.findDuplicates(
            dto.containerRuleDtos,
            (rule) => `${rule.validMenuItemId}`
        );
        if(dupliateItemRules){
                for(const duplicate of dupliateItemRules){
                    this.addError({
                    error: 'Menu item container has duplicate item settings.',
                    status: 'DUPLICATE',
                    contextEntity: 'CreateMenuItemContainerOptionsDto',
                    sourceEntity: 'MenuItemContainerRule',
                    value: { duplicateMenuItemId: duplicate.validMenuItemId },
                } as ValidationError);
            }
        }

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerOptionsDto | UpdateChildMenuItemContainerOptionsDto): Promise<ValidationError[]> {
        
        // No rules
        if(dto.containerRuleDtos && dto.containerRuleDtos.length === 0){
            this.addError({
                error: 'Menu item container has no settings.',
                status: 'INVALID',
                contextEntity: 'UpdateMenuItemContainerOptionsDto',
                contextId: id,
                sourceEntity: 'MenuItemContainerRule',
            } as ValidationError);
        }

        // Check no duplicate item rules
        if(dto.containerRuleDtos && dto.containerRuleDtos.length > 0){
            const resolvedDtos: {validMenuItemId: number}[] = [];
            for(const d of dto.containerRuleDtos){
                if(d.mode === 'create'){
                    resolvedDtos.push({ validMenuItemId: d.validMenuItemId});
                }
                else if(d.mode === 'update'){
                    const currentRule = await this.ruleService.findOne(d.id, ['validItem']);
                    resolvedDtos.push({validMenuItemId: d.validMenuItemId ?? currentRule.validItem.id})
                }
            }

            const dupliateItemRules = this.helper.findDuplicates(
                resolvedDtos,
                (rule) => `${rule.validMenuItemId}`
            );
            for(const duplicate of dupliateItemRules){
                    this.addError({
                    error: 'Menu item container has duplicate item settings.',
                    status: 'DUPLICATE',
                    contextEntity: 'UpdateMenuItemContainerOptionsDto',
                    contextId: id,
                    sourceEntity: 'MenuItemContainerRule',
                    value: { duplicateMenuItemId: duplicate.validMenuItemId },
                } as ValidationError);
            }
        }

        return this.errors;
    }
}