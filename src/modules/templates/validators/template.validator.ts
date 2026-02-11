import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { NestedCreateTemplateMenuItemDto } from '../dto/template-menu-item/nested-create-template-menu-item.dto';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template, TemplateEntity } from '../entities/template.entity';
import { TemplateMenuItemValidatorIdentity } from './identities/template-menu-item.validator.identities.interface';
import { TemplateValidatorIdentity } from './identities/template.validator.identities.interface';
import { TemplateMenuItemValidator } from './template-menu-item.validator';

@Injectable()
export class TemplateValidator extends ValidatorBase<TemplateEntity, TemplateValidatorIdentity> {
    constructor(
        @InjectRepository(Template)
        private readonly repo: Repository<Template>,
        private readonly templateItemValidator: TemplateMenuItemValidator,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Template', requestContextService, logger);
    }

    protected async validateIdentity(identity: TemplateValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
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

        if (identity.templateMenuItems && identity.templateMenuItems.length) {

            // enforce no duplicate menuItem
            this.helper.enforceNoDuplicateElements(
                identity.templateMenuItems,
                (tmi) => ({ id: tmi.id ?? tmi.createId, identity: `${tmi.menuItemId}` }),
                'templateMenuItems',
                errorMap,
            );

            // enforce no duplicate tablePosIndex
            this.helper.enforceNoDuplicateElements(
                identity.templateMenuItems,
                (tmi) => ({ id: tmi.id ?? tmi.createId, identity: `${tmi.tablePosIndex}` }),
                'templateMenuItems',
                errorMap,
            );

            for (const tmi of identity.templateMenuItems) {
                await this.templateItemValidator.validateNestedIdentity(
                    'templateMenuItems',
                    tmi,
                    errorMap,
                );
            }
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateTemplateDto | UpdateTemplateDto, id: number | string): Promise<TemplateValidatorIdentity> {
        const templateMenuItems: TemplateMenuItemValidatorIdentity[] = [];
        if (dto.templateMenuItems && dto.templateMenuItems.length) {
            for (const tmi of dto.templateMenuItems) {
                const itemId = tmi instanceof NestedCreateTemplateMenuItemDto ? tmi.createId : tmi.id;
                templateMenuItems.push(await this.templateItemValidator.resolveIdentity(tmi, itemId));
            }
        }

        return {
            name: dto.name,
            templateMenuItems: templateMenuItems,
        } as TemplateValidatorIdentity;
    }
}
