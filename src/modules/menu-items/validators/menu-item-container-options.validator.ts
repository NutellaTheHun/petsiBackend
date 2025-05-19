import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { CreateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-menu-item-container-options.dto";
import { UpdateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-menu-item-container-options.dto";

@Injectable()
export class MenuItemContainerOptionsValidator extends ValidatorBase<MenuItemContainerOptions> {
    constructor(
        @InjectRepository(MenuItemContainerOptions)
        private readonly repo: Repository<MenuItemContainerOptions>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemContainerOptionsDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemContainerOptionsDto): Promise<string | null> {
        return null;
    }
}