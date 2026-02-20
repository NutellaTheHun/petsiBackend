import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NestedValidatorBase } from '../../../common/base/nested-validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../dto/template-menu-item/nested-update-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import {
    TemplateMenuItem,
    TemplateMenuItemEntity,
} from '../entities/template-menu-item.entity';
import { Template } from '../entities/template.entity';
import { TemplateMenuItemValidatorIdentity } from './identities/template-menu-item.validator.identities.interface';

@Injectable()
export class TemplateMenuItemValidator extends NestedValidatorBase<TemplateMenuItemEntity, TemplateMenuItemValidatorIdentity> {
    constructor(
        @InjectRepository(TemplateMenuItem)
        private readonly repo: Repository<TemplateMenuItem>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepo: Repository<MenuItem>,
        @InjectRepository(Template)
        private readonly templateRepo: Repository<Template>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'TemplateMenuItem', requestContextService, logger);
    }

    public async resolveIdentity(dto: CreateTemplateMenuItemDto | NestedCreateTemplateMenuItemDto | UpdateTemplateMenuItemDto | NestedUpdateTemplateMenuItemDto, id: number | string): Promise<TemplateMenuItemValidatorIdentity> {
        return {
            id: dto instanceof NestedUpdateTemplateMenuItemDto ? dto.id : undefined,
            createId: dto instanceof NestedCreateTemplateMenuItemDto ? dto.createId : undefined,
            displayName: dto.displayName,
            menuItemId: dto.menuItemId,
            tablePosIndex: dto.tablePosIndex,
            parentTemplateId: dto instanceof CreateTemplateMenuItemDto ? dto.parentTemplateId : undefined,
        } as TemplateMenuItemValidatorIdentity;
    }

    protected async validateIdentity(identity: TemplateMenuItemValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.displayName) {
            await this.helper.enforceUnique(
                identity.displayName,
                this.repo,
                'displayName',
                errorMap,
            );
        }

        if (identity.menuItemId !== undefined) {
            await this.helper.enforceExists(
                identity.menuItemId,
                this.menuItemRepo,
                'menuItem',
                errorMap,
            );
        }

        if (identity.tablePosIndex !== undefined) {
            this.helper.enforcePositive(
                identity.tablePosIndex,
                'tablePosIndex',
                errorMap,
            );
        }

        if (identity.parentTemplateId !== undefined) {
            await this.helper.enforceExists(
                identity.parentTemplateId,
                this.templateRepo,
                'parentTemplate',
                errorMap,
            );
        }

        return errorMap;
    }
}
