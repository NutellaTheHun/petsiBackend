import { Injectable } from "@nestjs/common";
import { UnitCategoryService } from "../services/unit-category.service";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import { UnitCategory } from "../entities/unit-category.entity";
import * as CONSTANTS from "./constants";
import { CreateUnitCategoryDto } from "../dto/create-unit-category.dto";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";

@Injectable()
export class UnitOfMeasureTestingUtil {
    constructor(
        private readonly categoryService: UnitCategoryService,
        private readonly unitService: UnitOfMeasureService,
    ){ }

    public getCategoriesEntities(): UnitCategory[] {
        return [
            { name: CONSTANTS.UNIT} as UnitCategory,
            { name: CONSTANTS.VOLUME } as UnitCategory,
            { name: CONSTANTS.WEIGHT } as UnitCategory,
        ]
    }

    public async getUnitsOfMeasureEntities(): Promise<UnitOfMeasure[]> {
        const volumeCategory = await this.categoryService.findOneByName(CONSTANTS.VOLUME);
        const weightCategory = await this.categoryService.findOneByName(CONSTANTS.WEIGHT);
        const unitCategory = await this.categoryService.findOneByName(CONSTANTS.UNIT);
        
        return[
            // Volume
            {
                name: CONSTANTS.GALLON, 
                abbreviation: CONSTANTS.GALLON_ABBREV,
                category: volumeCategory, 
                conversionFactorToBase: "3785.4080001023799014"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.LITER, 
                abbreviation: CONSTANTS.LITER_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "999.99900039999965884"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.MILLILITER, 
                abbreviation: CONSTANTS.MILLILITER_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "1"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.FL_OUNCE, 
                abbreviation: CONSTANTS.FL_OUNCE_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "29.573500000799839427"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.QUART, 
                abbreviation: CONSTANTS.QUART_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "946.35200002559486165"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.PINT, 
                abbreviation: CONSTANTS.PINT_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "473.17600001279748767"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.TABLESPOON, 
                abbreviation: CONSTANTS.TABLESPOON_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "14.786750000399919713"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.TEASPOON, 
                abbreviation: CONSTANTS.TEASPOON_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "4.9289150730515665089"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.CUP, 
                abbreviation: CONSTANTS.CUP_ABBREV,
                category: volumeCategory,
                conversionFactorToBase: "239.99976009599993176"
            } as UnitOfMeasure, 

            // Weight
            {
                name: CONSTANTS.KILOGRAM, 
                abbreviation: CONSTANTS.KILOGRAM_ABBREV,
                category: weightCategory,
                conversionFactorToBase: "1000"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.GRAM, 
                abbreviation: CONSTANTS.GRAM_ABBREV,
                category: weightCategory,
                conversionFactorToBase: "1"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.OUNCE, 
                abbreviation: CONSTANTS.OUNCE_ABBREV,
                category: weightCategory,
                conversionFactorToBase: "28.3495"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.POUND, 
                abbreviation: CONSTANTS.POUND_ABBREV,
                category: weightCategory,
                conversionFactorToBase: "453.592000004704"
            } as UnitOfMeasure, 

            // Units
            {
                name: CONSTANTS.UNIT, 
                abbreviation: CONSTANTS.UNIT,
                category: unitCategory,
                conversionFactorToBase: "1"
            } as UnitOfMeasure, 
            {
                name: CONSTANTS.EACH, 
                abbreviation: CONSTANTS.EACH_ABBREV,
                category: unitCategory,
                conversionFactorToBase: "1"
            } as UnitOfMeasure, 
        ]
    }

    public async initializeUnitCategoryTestingDatabase(): Promise<void> {
        const categories = this.getCategoriesEntities();

        for(const category of categories){
            await this.categoryService.create(
                { name: category.name } as CreateUnitCategoryDto
            )
        }
    }

    public async initializeUnitOfMeasureTestingDatabase(): Promise<void> {
        const units = await this.getUnitsOfMeasureEntities();
        for(const unit of units){
            await this.unitService.create((
                {
                    name: unit.name,
                    abbreviation: unit.abbreviation,
                    categoryId: unit.category?.id,
                    conversionFactorToBase: unit.conversionFactorToBase,
                } as CreateUnitOfMeasureDto
            ))
        }
    }

    async initializeDefaultCategoryBaseUnits(): Promise<void> {
        await this.setCategoryBaseUnit(CONSTANTS.WEIGHT, CONSTANTS.GRAM);
        await this.setCategoryBaseUnit(CONSTANTS.VOLUME, CONSTANTS.MILLILITER);
        await this.setCategoryBaseUnit(CONSTANTS.UNIT, CONSTANTS.UNIT);
    }
    
      
    async setCategoryBaseUnit(categoryName: string, baseUnitOfMeasure: string): Promise<void> {
        const category = await this.categoryService.findOneByName(categoryName);
        if(!category){ throw new Error(`${categoryName} category not found.`); }
    
        const baseUnit = await this.unitService.findOneByName(baseUnitOfMeasure, ['category']);
        if(!baseUnit){ throw new Error("base unit not found"); }
        category.baseUnit = baseUnit;
        
        await this.categoryService.update(
            category.id,
            {
                name: category.name,
                baseUnitId: category.baseUnit.id 
            } as UpdateUnitCategoryDto
        );
    }
}