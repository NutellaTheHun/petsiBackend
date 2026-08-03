import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { Setting, SettingEntity } from '../entities/setting.entity';
import { getRegisteredValueType, isRegisteredSettingKey } from '../utils/setting-key.registry';
import { matchesSettingValueType } from '../utils/setting-value.util';
import { SettingValidatorIdentity } from './identities/setting.validator.identity.interface';

@Injectable()
export class SettingValidator extends ValidatorBase<SettingEntity, SettingValidatorIdentity> {
    constructor(
        @InjectRepository(Setting)
        private readonly repo: Repository<Setting>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'Setting', requestContextService, logger);
    }

    protected async validateIdentity(
        identity: SettingValidatorIdentity,
        id: number | string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        // On update, `name` is resolved from the existing row in
        // resolveIdentity (name/locationId are immutable after create). If
        // that lookup found nothing (e.g. a nonexistent update id), leave
        // this validation out and let ServiceBase.update's findOne surface
        // the NotFoundException instead of a misleading validation error.
        if (identity.name === undefined) {
            return errorMap;
        }

        if (!isRegisteredSettingKey(identity.name)) {
            errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['name']);
            return errorMap;
        }

        const expectedType = getRegisteredValueType(identity.name)!;
        if (identity.value !== undefined && !matchesSettingValueType(expectedType, identity.value)) {
            errorMap.addError('INVALID_PROPERTY_VALUE', undefined, ['value']);
        }

        await this.helper.enforceUnique(identity.name, this.repo, 'name', errorMap, id, {
            tenantId: this.requestContextService.get<number>('tenantId'),
            locationId: identity.locationId ?? null,
        });

        return errorMap;
    }

    public async resolveIdentity(
        dto: CreateSettingDto | UpdateSettingDto,
        id: number | string,
    ): Promise<SettingValidatorIdentity> {
        if (id === 'root') {
            const createDto = dto as CreateSettingDto;
            return {
                name: createDto.name,
                locationId: createDto.locationId ?? null,
                value: createDto.value,
            };
        }

        const existing = await this.repo.findOne({ where: { id: id as number } });
        return {
            name: existing?.name,
            locationId: existing?.locationId ?? null,
            value: (dto as UpdateSettingDto).value,
        };
    }
}
