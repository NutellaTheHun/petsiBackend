import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateUnitOfMeasureCategoryDto } from "../dto/unit-of-measure-category/create-unit-of-measure-category.dto";
import { UpdateUnitOfMeasureCategoryDto } from "../dto/unit-of-measure-category/update-unit-of-measure-category.dto";
import { UnitOfMeasureCategory } from "../entities/unit-of-measure-category.entity";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class UnitOfMeasureCategoryValidator extends ValidatorBase<UnitOfMeasureCategory> {
    constructor(
        @InjectRepository(UnitOfMeasureCategory)
        private readonly repo: Repository<UnitOfMeasureCategory>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'UnitOfMeasureCategory', requestContextService, logger); }

    public async validateCreate(dto: CreateUnitOfMeasureCategoryDto): Promise<void> {
        if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
            this.addError({
                errorMessage: 'Unit of measure category with that name already exists.',
                errorType: 'EXIST',
                contextEntity: 'CreateUnitOfMeasureCategoryDto',
                sourceEntity: 'UnitOfMeasureCategory',
                value: dto.categoryName,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateUnitOfMeasureCategoryDto): Promise<void> {
        if (dto.categoryName) {
            if (await this.helper.exists(this.repo, 'categoryName', dto.categoryName)) {
                this.addError({
                    errorMessage: 'Unit of measure category with that name already exists.',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateUnitOfMeasureCategoryDto',
                    contextId: id,
                    sourceEntity: 'UnitOfMeasureCategory',
                    value: dto.categoryName,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}