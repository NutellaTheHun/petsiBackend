import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultUnitOfMeasureDtoValues, CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UpdateUnitOfMeasureDto } from "../dto/update-unit-of-measure.dto";
import { UnitCategoryService } from "../services/unit-category.service";
import { CUP, CUP_ABBREV, EACH, EACH_ABBREV, FL_OUNCE, FL_OUNCE_ABBREV, GALLON, GALLON_ABBREV, GRAM, GRAM_ABBREV, KILOGRAM, KILOGRAM_ABBREV, LITER, LITER_ABBREV, MILLILITER, MILLILITER_ABBREV, OUNCE, OUNCE_ABBREV, PINT, PINT_ABBREV, POUND, POUND_ABBREV, QUART, QUART_ABBREV, TABLESPOON, TABLESPOON_ABBREV, TEASPOON, TEASPOON_ABBREV, UNIT, VOLUME, WEIGHT } from "../utils/constants";

@Injectable()
export class UnitOfMeasureFactory extends EntityFactory<UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto>{
    constructor(
        @Inject(forwardRef(() => UnitCategoryService))
        private readonly categoryService: UnitCategoryService,
    ) {
        super(UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto, CreateDefaultUnitOfMeasureDtoValues());
        this.categoryService = categoryService;
    }

    async getDefaultRoles(): Promise<UnitOfMeasure[]> {
        return [
            this.createEntityInstance({
                name: GALLON, 
                abbreviation: GALLON_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "3785.4080001023799014"
            }),
            this.createEntityInstance({
                name: LITER, 
                abbreviation: LITER_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "999.99900039999965884"
            }),
            this.createEntityInstance({
                name: MILLILITER, 
                abbreviation: MILLILITER_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "1"
            }),
            this.createEntityInstance({
                name: FL_OUNCE, 
                abbreviation: FL_OUNCE_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "29.573500000799839427"
            }),
            this.createEntityInstance({
                name: QUART, 
                abbreviation: QUART_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "946.35200002559486165"
            }),
            this.createEntityInstance({
                name: PINT, 
                abbreviation: PINT_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "473.17600001279748767"
            }),
            this.createEntityInstance({
                name: TABLESPOON, 
                abbreviation: TABLESPOON_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "14.786750000399919713"
            }),
            this.createEntityInstance({
                name: TEASPOON, 
                abbreviation: TEASPOON_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "4.9289150730515665089"
            }),
            this.createEntityInstance({
                name: CUP, 
                abbreviation: CUP_ABBREV,
                category: await this.categoryService.findOneByName(VOLUME),
                conversionFactorToBase: "239.99976009599993176"
            }),

            this.createEntityInstance({
                name: KILOGRAM, 
                abbreviation: KILOGRAM_ABBREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: "1000"
            }),
            this.createEntityInstance({
                name: GRAM, 
                abbreviation: GRAM_ABBREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: "1"
            }),
            this.createEntityInstance({
                name: OUNCE, 
                abbreviation: OUNCE_ABBREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: "28.3495"
            }),
            this.createEntityInstance({
                name: POUND, 
                abbreviation: POUND_ABBREV,
                category: await this.categoryService.findOneByName(WEIGHT),
                conversionFactorToBase: "453.592000004704"
            }),

            this.createEntityInstance({
                name: UNIT, 
                abbreviation: UNIT,
                category: await this.categoryService.findOneByName(UNIT),
                conversionFactorToBase: "1"
            }),
            this.createEntityInstance({
                name: EACH, 
                abbreviation: EACH_ABBREV,
                category: await this.categoryService.findOneByName(UNIT),
                conversionFactorToBase: "1"
            }),
        ];
    }

    async getTestingRoles(): Promise<UnitOfMeasure[]>{
        return await this.getDefaultRoles();
    }  
}