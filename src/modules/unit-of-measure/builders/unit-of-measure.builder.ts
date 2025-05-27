import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BuilderBase } from "../../../base/builder-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { CreateUnitOfMeasureDto } from "../dto/unit-of-measure/create-unit-of-measure.dto";
import { UpdateUnitOfMeasureDto } from "../dto/unit-of-measure/update-unit-of-measure.dto";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitOfMeasureCategoryService } from "../services/unit-of-measure-category.service";
import { UnitOfMeasureValidator } from "../validators/unit-of-measure.validator";

@Injectable()
export class UnitOfMeasureBuilder extends BuilderBase<UnitOfMeasure> {
    constructor(
        @Inject(forwardRef(() => UnitOfMeasureCategoryService))
        private readonly categoryService: UnitOfMeasureCategoryService,

        validator: UnitOfMeasureValidator,
        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(UnitOfMeasure, 'UnitOfMeasureBuilder', requestContextService, logger, validator); }

    protected createEntity(dto: CreateUnitOfMeasureDto): void {
        if (dto.unitName !== undefined) {
            this.name(dto.unitName);
        }
        if (dto.abbreviation !== undefined) {
            this.abbreviation(dto.abbreviation);
        }
        if (dto.conversionFactorToBase !== undefined) {
            this.conversionFactor(dto.conversionFactorToBase);
        }
        if (dto.categoryId !== undefined) {
            this.categoryById(dto.categoryId);
        }
    }

    protected updateEntity(dto: UpdateUnitOfMeasureDto): void {
        if (dto.unitName !== undefined) {
            this.name(dto.unitName);
        }
        if (dto.abbreviation !== undefined) {
            this.abbreviation(dto.abbreviation);
        }
        if (dto.conversionFactorToBase !== undefined) {
            this.conversionFactor(dto.conversionFactorToBase);
        }
        if (dto.categoryId !== undefined) {
            this.categoryById(dto.categoryId);
        }
    }

    public name(name: string): this {
        return this.setPropByVal('name', name);
    }

    public abbreviation(abr: string): this {
        return this.setPropByVal('abbreviation', abr);
    }

    public categoryById(id: number | null): this {
        if (id === null) {
            return this.setPropByVal('category', null);
        }
        return this.setPropById(this.categoryService.findOne.bind(this.categoryService), 'category', id);
    }

    public categoryByName(name: string): this {
        return this.setPropByName(this.categoryService.findOneByName.bind(this.categoryService), 'category', name);
    }

    public conversionFactor(value: string): this {
        return this.setPropByVal('conversionFactorToBase', value);
    }
}