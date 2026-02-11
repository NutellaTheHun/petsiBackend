import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import {
    MenuItemCategory,
    MenuItemCategoryEntity,
} from '../entities/menu-item-category.entity';
import { MenuItemCategoryValidatorIdentity } from './identities/menu-item-category.validator.identity.interface';

@Injectable()
export class MenuItemCategoryValidator extends ValidatorBase<MenuItemCategoryEntity, MenuItemCategoryValidatorIdentity> {

    constructor(
        @InjectRepository(MenuItemCategory)
        private readonly repo: Repository<MenuItemCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'MenuItemCategory', requestContextService, logger);
    }

    protected async validateIdentity(identity: MenuItemCategoryValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
                id,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateMenuItemCategoryDto | UpdateMenuItemCategoryDto, id: number | string): Promise<MenuItemCategoryValidatorIdentity> {
        return {
            name: dto.name,
        } as MenuItemCategoryValidatorIdentity;
    }
}
