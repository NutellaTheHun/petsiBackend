import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItemDynamicPropertyValue } from '../../menu-items/entities/menu-item-dynamic-property-value.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/create-dynamic-property-config.dto';
import { UpdateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/update-dynamic-property-config.dto';
import {
    DynamicPropertyConfig,
    DynamicPropertyConfigEntity,
    ValueType,
} from '../entities/dynamic-property-config.entity';
import { DynamicPropertyConfigValidatorIdentity } from './identities/dynamic-property-config.validator.identity.interface';

@Injectable()
export class DynamicPropertyConfigValidator extends ValidatorBase<
    DynamicPropertyConfigEntity,
    DynamicPropertyConfigValidatorIdentity
> {
    constructor(
        @InjectRepository(DynamicPropertyConfig)
        private readonly repo: Repository<DynamicPropertyConfig>,
        @InjectRepository(MenuItemDynamicPropertyValue)
        private readonly dynPropValueRepo: Repository<MenuItemDynamicPropertyValue>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'DynamicPropertyConfig', requestContextService, logger);
    }

    protected async validateIdentity(
        identity: DynamicPropertyConfigValidatorIdentity,
        id: number | string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (identity.holderEntityType && identity.propertyName) {
            const existing = await this.repo.findOne({
                where: {
                    holderEntityType: identity.holderEntityType,
                    propertyName: identity.propertyName,
                },
            });
            if (existing && existing.id !== id) {
                errorMap.addError('ALREADY_EXISTS', undefined, ['propertyName']);
            }
        }

        if (
            identity.valueType === ValueType.EntityReference &&
            (identity.valueEntityType == null || identity.valueEntityType === '')
        ) {
            errorMap.addError('MISSING_PROPERTY', undefined, ['valueEntityType']);
        }

        if (identity.existingHolderEntityType !== undefined) {
            const changedFields: string[] = [];

            if (identity.holderEntityType !== undefined && identity.holderEntityType !== identity.existingHolderEntityType) {
                changedFields.push('holderEntityType');
            }
            if (identity.holderCategoryId !== undefined && identity.holderCategoryId !== identity.existingHolderCategoryId) {
                changedFields.push('holderCategoryId');
            }
            if (identity.valueType !== undefined && identity.valueType !== identity.existingValueType) {
                changedFields.push('valueType');
            }
            if ('valueEntityType' in identity && identity.valueEntityType !== identity.existingValueEntityType) {
                changedFields.push('valueEntityType');
            }
            if (identity.valueEntityCategoryId !== undefined && identity.valueEntityCategoryId !== identity.existingValueEntityCategoryId) {
                changedFields.push('valueEntityCategoryId');
            }

            if (changedFields.length > 0) {
                const hasValues = await this.dynPropValueRepo.exists({ where: { config: { id: id as number } } });
                if (hasValues) {
                    for (const field of changedFields) {
                        errorMap.addError('IMMUTABLE_FIELD', undefined, [field]);
                    }
                }
            }
        }

        return errorMap;
    }

    public async resolveIdentity(
        dto: CreateDynamicPropertyConfigDto | UpdateDynamicPropertyConfigDto,
        id: number | string,
    ): Promise<DynamicPropertyConfigValidatorIdentity> {
        let existing: DynamicPropertyConfig | null = null;
        if (id !== 'root') {
            existing = await this.repo.findOne({ where: { id: id as number }, relations: ['holderCategory', 'valueEntityCategory'] });
        }

        return {
            holderEntityType: dto.holderEntityType,
            holderCategoryId: dto.holderCategoryId,
            propertyName: dto.propertyName,
            valueType: dto.valueType,
            ...('valueEntityType' in dto && { valueEntityType: dto.valueEntityType }),
            valueEntityCategoryId: dto.valueEntityCategoryId,
            ...(existing != null && {
                existingHolderEntityType: existing.holderEntityType,
                existingHolderCategoryId: existing.holderCategory?.id ?? null,
                existingValueType: existing.valueType,
                existingValueEntityType: existing.valueEntityType ?? null,
                existingValueEntityCategoryId: existing.valueEntityCategory?.id ?? null,
            }),
        };
    }
}
