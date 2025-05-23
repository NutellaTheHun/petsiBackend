import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";
import { MenuItemSize } from "../entities/menu-item-size.entity";

@Injectable()
export class MenuItemSizeValidator extends ValidatorBase<MenuItemSize> {
    constructor(
        @InjectRepository(MenuItemSize)
        private readonly repo: Repository<MenuItemSize>,
    ) { super(repo); }

    public async validateCreate(dto: CreateMenuItemSizeDto): Promise<void> {

        // exists
        if (await this.helper.exists(this.repo, 'name', dto.sizeName)) {
            this.addError({
                error: 'Menu item size already exists.',
                status: 'EXIST',
                contextEntity: 'CreateMenuItemSizeDto',
                sourceEntity: 'MenuItemSize',
                value: dto.sizeName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateMenuItemSizeDto): Promise<void> {

        // exists
        if (dto.sizeName) {
            if (await this.helper.exists(this.repo, 'name', dto.sizeName)) {
                this.addError({
                    error: 'Menu item size already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateMenuItemSizeDto',
                    sourceEntity: 'MenuItemSize',
                    value: dto.sizeName,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}