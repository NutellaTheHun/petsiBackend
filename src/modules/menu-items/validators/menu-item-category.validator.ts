import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateMenuItemCategoryDto } from "../dto/menu-item-category/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/menu-item-category/update-menu-item-category.dto";
import { MenuItemCategory } from "../entities/menu-item-category.entity";

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategory> {
    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly repo: Repository<MenuItemCategory>,
    ) { super(repo); }

    public async validateCreate(dto: CreateMenuItemCategoryDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
            this.addError({
                error: 'Menu category name already exists.',
                status: 'EXIST',
                contextEntity: 'CreateMenuItemCategoryDto',
                sourceEntity: 'MenuItemCategory',
                value: dto.categoryName,
            } as ValidationError)
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateMenuItemCategoryDto): Promise<void> {
        if (dto.categoryName) {
            if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
                this.addError({
                    error: 'Menu category name already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateMenuItemCategoryDto',
                    contextId: id,
                    sourceEntity: 'MenuItemCategory',
                    value: dto.categoryName,
                } as ValidationError)
            }
        }

        this.throwIfErrors()
    }
}