import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType, LabelTypeEntity } from '../entities/label-type.entity';
import { LabelTypeValidatorIdentity } from './identities/label-type.validator.identity.interface';

@Injectable()
export class LabelTypeValidator extends ValidatorBase<LabelTypeEntity, LabelTypeValidatorIdentity> {

    constructor(
        @InjectRepository(LabelType)
        private readonly repo: Repository<LabelType>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'LabelType', requestContextService, logger);
    }

    protected async validateIdentity(identity: LabelTypeValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
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

        if (identity.length !== undefined) {
            this.helper.enforcePositive(
                identity.length,
                'length',
                errorMap,
            );
        }
        if (identity.width !== undefined) {
            this.helper.enforcePositive(
                identity.width,
                'width',
                errorMap,
            );
        }
        return errorMap;
    }

    public async resolveIdentity(dto: CreateLabelTypeDto | UpdateLabelTypeDto, id: number | string): Promise<LabelTypeValidatorIdentity> {
        return {
            name: dto.name,
            length: dto.length,
            width: dto.width,
        } as LabelTypeValidatorIdentity;
    }
}
