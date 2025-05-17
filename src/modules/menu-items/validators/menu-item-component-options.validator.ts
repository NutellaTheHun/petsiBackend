import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemComponentOptionsDto } from "../dto/create-menu-item-component-options.dto";
import { UpdateMenuItemComponentOptionsDto } from "../dto/update-menu-item-component-options.dto";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";

@Injectable()
export class MenuItemComponentOptionsValidator extends ValidatorBase<MenuItemComponentOptions> {
    constructor(
        @InjectRepository(MenuItemComponentOptions)
        private readonly repo: Repository<MenuItemComponentOptions>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemComponentOptionsDto): Promise<string | null> {
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemComponentOptionsDto): Promise<string | null> {
        return null;
    }
}