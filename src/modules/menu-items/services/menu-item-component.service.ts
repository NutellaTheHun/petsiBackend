import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ServiceBase } from "../../../base/service-base";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MenuItemComponentBuilder } from "../builders/menu-item-component.builder";
import { CreateMenuItemComponentDto } from "../dto/create-menu-item-component.dto";
import { UpdateMenuItemComponentDto } from "../dto/update-menu-item-component.dto";
import { MenuItemComponentValidator } from "../validators/menu-item-component.validator";

@Injectable()
export class MenuItemComponentService extends ServiceBase<MenuItemComponent> {P
    constructor(
        @InjectRepository(MenuItemComponent)
        private readonly componentRepo: Repository<MenuItemComponent>,

        @Inject(forwardRef(() => MenuItemComponentBuilder))
        private readonly componentBuilder: MenuItemComponentBuilder,

        validator: MenuItemComponentValidator,
    ){ super(componentRepo, componentBuilder, validator, 'MenuItemComponentService'); }

    async create(dto: CreateMenuItemComponentDto): Promise<MenuItemComponent | null> {
        const category = await this.componentBuilder.buildCreateDto(dto);
        return await this.componentRepo.save(category);
    }

    async update(id: number, dto: UpdateMenuItemComponentDto): Promise<MenuItemComponent | null> {
        const toUpdate = await this.findOne(id);
        if(!toUpdate) { return null; }

        await this.componentBuilder.buildUpdateDto(toUpdate, dto);
        return await this.componentRepo.save(toUpdate);
    }
}