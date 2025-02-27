import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultUnitOfMeasureDtoValues, CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UpdateUnitOfMeasureDto } from "../dto/update-unit-of-measure.dto";
import { UnitCategoryService } from "../services/unit-category.service";
import { EACH, EACH_ABREV, FL_OUNCE, FL_OUNCE_ABREV, GALLON, GALLON_ABREV, GRAM, GRAM_ABREV, KILOGRAM, KILOGRAM_ABREV, LITER, LITER_ABREV, MILLILITER, MILLILITER_ABREV, OUNCE, OUNCE_ABREV, PINT, PINT_ABREV, POUND, POUND_ABREV, QUART, QUART_ABREV, UNIT, VOLUME, WEIGHT } from "../utils/constants";

@Injectable()
export class UnitOfMeasureFactory extends EntityFactory<UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto>{
    constructor(
        private readonly categoryService: UnitCategoryService,
    ) {
        super(UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto, CreateDefaultUnitOfMeasureDtoValues());
        this.categoryService = categoryService;
    }

    // name: string
    // abreviation: string
    // category entity: UnitCategory
    // conversionFactorBase?: string
    async getDefaultRoles(): Promise<UnitOfMeasure[]> {
        return [
            this.createEntityInstance({
                name: GALLON, 
                abbreviation: GALLON_ABREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: LITER, 
                abbreviation: LITER_ABREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: MILLILITER, 
                abbreviation: MILLILITER_ABREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: FL_OUNCE, 
                abbreviation: FL_OUNCE_ABREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: QUART, 
                abbreviation: QUART_ABREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: PINT, 
                abbreviation: PINT_ABREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: ""
            }),

            this.createEntityInstance({
                name: KILOGRAM, 
                abbreviation: KILOGRAM_ABREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: GRAM, 
                abbreviation: GRAM_ABREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: OUNCE, 
                abbreviation: OUNCE_ABREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: POUND, 
                abbreviation: POUND_ABREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: ""
            }),

            this.createEntityInstance({
                name: UNIT, 
                abbreviation: UNIT,
                category: await this.categoryService.findOneByName(UNIT),
                conversionFactorToBase: ""
            }),
            this.createEntityInstance({
                name: EACH, 
                abbreviation: EACH_ABREV,
                category: await this.categoryService.findOneByName(UNIT),
                conversionFactorToBase: ""
            }),
        ];
    }

    async getTestingRoles(): Promise<UnitOfMeasure[]>{
        return await this.getDefaultRoles();
    }  
}