import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import {
    UnitOfMeasure,
    UnitOfMeasureEntity,
} from '../entities/unit-of-measure.entity';
import { UnitOfMeasureValidatorIdentity } from './identities/unit-of-measure.validator.identity.interface';

@Injectable()
export class UnitOfMeasureValidator extends ValidatorBase<UnitOfMeasureEntity, UnitOfMeasureValidatorIdentity> {
    constructor(
        @InjectRepository(UnitOfMeasure)
        private readonly repo: Repository<UnitOfMeasure>,

        @InjectRepository(UnitOfMeasureCategory)
        private readonly unitOfMeasureCategoryRepo: Repository<UnitOfMeasureCategory>,

        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'UnitOfMeasure', requestContextService, logger);
    }

    protected async validateIdentity(identity: UnitOfMeasureValidatorIdentity, id: number | string): Promise<ValidationErrorMap> {
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

        if (identity.abbreviation) {
            await this.helper.enforceUnique(
                identity.abbreviation,
                this.repo,
                'abbreviation',
                errorMap,
                id,
            );
        }

        if (identity.conversionFactorToBase) {
            this.helper.enforcePositive(
                identity.conversionFactorToBase,
                'conversionFactorToBase',
                errorMap,
            );
        }

        if (identity.categoryId !== undefined) {
            await this.helper.enforceExists(
                identity.categoryId,
                this.unitOfMeasureCategoryRepo,
                'category',
                errorMap,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateUnitOfMeasureDto | UpdateUnitOfMeasureDto, id: number | string): Promise<UnitOfMeasureValidatorIdentity> {
        return {
            name: dto.name,
            abbreviation: dto.abbreviation,
            categoryId: dto.categoryId,
            conversionFactorToBase: dto.conversionFactorToBase,
        } as UnitOfMeasureValidatorIdentity;
    }
}
