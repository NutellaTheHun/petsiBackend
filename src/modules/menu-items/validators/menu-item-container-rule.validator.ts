import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/create-menu-item-container-rule.dto";
import { UpdateMenuItemContainerRuleDto } from "../dto/menu-item-container-rule/update-menu-item-container-rule.dto";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";

@Injectable()
export class MenuItemContainerRuleValidator extends ValidatorBase<MenuItemContainerRule> {
    constructor(
        @InjectRepository(MenuItemContainerRule)
        private readonly repo: Repository<MenuItemContainerRule>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemContainerRuleDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerRuleDto): Promise<string | null> {
        return null;
    }
}