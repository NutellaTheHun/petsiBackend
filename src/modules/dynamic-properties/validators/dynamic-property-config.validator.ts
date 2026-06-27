import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
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

        return errorMap;
    }

    public async resolveIdentity(
        dto: CreateDynamicPropertyConfigDto | UpdateDynamicPropertyConfigDto,
        id: number | string,
    ): Promise<DynamicPropertyConfigValidatorIdentity> {
        return {
            holderEntityType: dto.holderEntityType,
            propertyName: dto.propertyName,
            valueType: dto.valueType,
            valueEntityType: dto.valueEntityType,
        };
    }
}
