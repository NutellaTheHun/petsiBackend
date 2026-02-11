import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import {
    UnitOfMeasureCategory,
    UnitOfMeasureCategoryEntity,
} from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasureCategoryValidatorIdentity } from './identities/unit-of-measure-category.validator.identity.interface';

@Injectable()
export class UnitOfMeasureCategoryValidator extends ValidatorBase<UnitOfMeasureCategoryEntity, UnitOfMeasureCategoryValidatorIdentity> {
    constructor(
        @InjectRepository(UnitOfMeasureCategory)
        private readonly repo: Repository<UnitOfMeasureCategory>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(repo, 'UnitOfMeasureCategory', requestContextService, logger);
    }

    protected async validateIdentity(identity: UnitOfMeasureCategoryValidatorIdentity, id?: number | string): Promise<ValidationErrorMap> {
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

        if (identity.baseConversionUnitId) {
            await this.helper.enforceExists(
                identity.baseConversionUnitId,
                this.repo,
                'baseConversionUnit',
                errorMap,
            );
        }

        return errorMap;
    }

    public async resolveIdentity(dto: CreateUnitOfMeasureCategoryDto | UpdateUnitOfMeasureCategoryDto, id: number | string): Promise<UnitOfMeasureCategoryValidatorIdentity> {
        return {
            name: dto.name,
            baseConversionUnitId: dto.baseConversionUnitId,
        } as UnitOfMeasureCategoryValidatorIdentity;
    }

    protected async doValidateCreateNode(
        dto: CreateUnitOfMeasureCategoryDto,
        id?: string,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        await this.helper.enforceUnique(
            dto.name,
            this.repo,
            'name',
            errorMap,
            'Category with this name already exists.',
        );

        return errorMap;
    }

    protected async doValidateUpdateNode(
        dto: UpdateUnitOfMeasureCategoryDto,
        id: number,
    ): Promise<ValidationErrorMap> {
        const errorMap = new ValidationErrorMap(id);

        if (dto.name) {
            await this.helper.enforceUnique(
                dto.name,
                this.repo,
                'name',
                errorMap,
                'Category with this name already exists.',
            );
        }

        return errorMap;
    }
}
