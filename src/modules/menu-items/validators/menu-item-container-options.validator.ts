import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-child-menu-item-container-options.dto";
import { UpdateChildMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-child-menu-item-container-options.dto";
import { UpdateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-menu-item-container-options.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItemContainerRuleService } from "../services/menu-item-container-rule.service";

@Injectable()
export class MenuItemContainerOptionsValidator extends ValidatorBase<MenuItemContainerOptions> {
    constructor(
        @InjectRepository(MenuItemContainerOptions)
        private readonly repo: Repository<MenuItemContainerOptions>,
        
        @Inject(forwardRef(() => MenuItemContainerRuleService))
        private readonly ruleService: MenuItemContainerRuleService,
    ){ super(repo); }

    public async validateCreate(dto: CreateChildMenuItemContainerOptionsDto): Promise<string | null> {
        if(dto.containerRuleDtos.length === 0){
            return 'container options cannot have 0 rules'
        }
        // Check no duplicate item rules
        const dupliateItemRules = this.helper.hasDuplicatesByComposite(
            dto.containerRuleDtos,
            (rule) => `${rule.validMenuItemId}`
        )
        if(dupliateItemRules){
            return `container option contains duplicate rules for the same menuItem`;
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerOptionsDto | UpdateChildMenuItemContainerOptionsDto): Promise<string | null> {
        if(dto.containerRuleDtos && dto.containerRuleDtos.length === 0){
            return 'container options cannot have 0 rules'
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

            const dupliateItemRules = this.helper.hasDuplicatesByComposite(
                resolvedDtos,
                (rule) => `${rule.validMenuItemId}`
            )
            if(dupliateItemRules){
                return `container option contains duplicate rules for the same menuItem`;
            }
        }
        return null;
    }
}