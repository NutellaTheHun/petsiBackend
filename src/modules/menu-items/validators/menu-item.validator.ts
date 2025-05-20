import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly repo: Repository<MenuItem>,
    ){ super(repo); }

    public async validateCreate(dto: CreateMenuItemDto): Promise<string | null> {
        // Cannot already exist (name is used)
        const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
        if(exists) { 
            return `Menu item with name ${dto.itemName} already exists`; 
        }

        // Cannot assign both containerOptions and a definedContainer 
        if(dto.containerOptionDto && dto.definedContainerItemDtos){
            return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
        }
        return null;
    }
    
    public async validateUpdate(id: number, dto: UpdateMenuItemDto): Promise<string | null> {
        // Cannot change name to another existing item
        if(dto.itemName){
            const exists = await this.repo.findOne({ where: { itemName: dto.itemName }});
            if(exists) { 
                return `Menu item with name ${dto.itemName} already exists`; 
            }
        }

        // Cannot assign both containerOptions and a definedContainer
        if(dto.containerOptionDto && dto.definedContainerItemDtos){
            return `Cannot create MenuItem with both containerOptions and definedContainerItems`;
        }

        return null;
    }
}