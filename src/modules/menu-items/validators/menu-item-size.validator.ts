import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateMenuItemSizeDto } from '../dto/menu-item-size/create-menu-item-size.dto';
import { UpdateMenuItemSizeDto } from '../dto/menu-item-size/update-menu-item-size.dto';
import {
    MenuItemSize,
    MenuItemSizeEntity,
} from '../entities/menu-item-size.entity';
import { MenuItemSizeValidatorIdentity } from './identities/menu-item-size.validator.identity.interface';

@Injectable()
export class MenuItemSizeValidator extends ValidatorBase<MenuItemSizeEntity, MenuItemSizeValidatorIdentity> {

    constructor(
        @InjectRepository(MenuItemSize)
        private readonly repo: Repository<MenuItemSize>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'MenuItemSize', requestContextService, logger);
    }

    protected async validateIdentity(identity: MenuItemSizeValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.name) {
            await this.helper.enforceUnique(
                identity.name,
                this.repo,
                'name',
                errorMap,
            );
        }

        return errorMap;
    }
    public async resolveIdentity(dto: CreateMenuItemSizeDto | UpdateMenuItemSizeDto, id: number | string): Promise<MenuItemSizeValidatorIdentity> {
        return {
            name: dto.name,
        } as MenuItemSizeValidatorIdentity;
    }

    protected async doValidateCreateNode(
        dto: CreateMenuItemSizeDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // exists
        await this.helper.enforceUnique(
            dto.name,
            this.repo,
            'name',
            errorMap,
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateMenuItemSizeDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (dto.name) {
            await this.helper.enforceUnique(
                dto.name,
                this.repo,
                'name',
                errorMap,
            );
        }

        return errorMap;
    }
}
