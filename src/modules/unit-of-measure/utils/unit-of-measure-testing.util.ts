import { Injectable } from "@nestjs/common";
import { UnitCategoryBuilder } from "../builders/unit-category.builder";
import { UnitOfMeasureBuilder } from "../builders/unit-of-measure.builder";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";
import { UnitCategory } from "../entities/unit-category.entity";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UnitCategoryService } from "../services/unit-category.service";
import { UnitOfMeasureService } from "../services/unit-of-measure.service";
import * as CONSTANTS from "./constants";
import { DatabaseTestContext } from "../../../util/DatabaseTestContext";

@Injectable()
export class UnitOfMeasureTestingUtil {
    constructor(
        private readonly categoryService: UnitCategoryService,
        private readonly categoryBuilder: UnitCategoryBuilder,

        private readonly unitService: UnitOfMeasureService,
        private readonly unitBuilder: UnitOfMeasureBuilder,
    ){ }

    public async getCategoryEntities(testContext: DatabaseTestContext): Promise<UnitCategory[]> {
        return [
            await await this.categoryBuilder.reset()
                .name(CONSTANTS.UNIT)
                .build(),
            await await this.categoryBuilder.reset()
                .name(CONSTANTS.VOLUME)
                .build(),
            await await this.categoryBuilder.reset()
                .name(CONSTANTS.WEIGHT)
                .build(),
        ];
    }

    /**
     * Dependencies: UnitCategory
     * @returns
     */
    public async getUnitsOfMeasureEntities(testContext: DatabaseTestContext): Promise<UnitOfMeasure[]> {
        await this.initUnitCategoryTestDatabase(testContext);

        return[
            // Volume
            await await this.unitBuilder.reset()
                .name(CONSTANTS.GALLON)
                .abbreviation(CONSTANTS.GALLON_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("3785.4080001023799014")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.LITER)
                .abbreviation(CONSTANTS.LITER_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("999.99900039999965884")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.MILLILITER)
                .abbreviation(CONSTANTS.MILLILITER_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("1")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.FL_OUNCE)
                .abbreviation(CONSTANTS.FL_OUNCE_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("29.573500000799839427")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.QUART)
                .abbreviation(CONSTANTS.QUART_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("946.35200002559486165")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.PINT)
                .abbreviation(CONSTANTS.PINT_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("473.17600001279748767")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.TABLESPOON)
                .abbreviation(CONSTANTS.TABLESPOON_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("14.786750000399919713")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.TEASPOON)
                .abbreviation(CONSTANTS.TEASPOON_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("4.9289150730515665089")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.CUP)
                .abbreviation(CONSTANTS.CUP_ABBREV)
                .categoryByName(CONSTANTS.VOLUME)
                .conversionFactor("239.99976009599993176")
                .build(),

            // Weight
            await this.unitBuilder.reset()
                .name(CONSTANTS.GRAM)
                .abbreviation(CONSTANTS.GRAM_ABBREV)
                .categoryByName(CONSTANTS.WEIGHT)
                .conversionFactor("1")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.KILOGRAM)
                .abbreviation(CONSTANTS.KILOGRAM_ABBREV)
                .categoryByName(CONSTANTS.WEIGHT)
                .conversionFactor("1000")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.OUNCE)
                .abbreviation(CONSTANTS.OUNCE_ABBREV)
                .categoryByName(CONSTANTS.WEIGHT)
                .conversionFactor("28.3495")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.POUND)
                .abbreviation(CONSTANTS.POUND_ABBREV)
                .categoryByName(CONSTANTS.WEIGHT)
                .conversionFactor("453.592000004704")
                .build(),

            // Units
            await this.unitBuilder.reset()
                .name(CONSTANTS.EACH)
                .abbreviation(CONSTANTS.EACH_ABBREV)
                .categoryByName(CONSTANTS.UNIT)
                .conversionFactor("1")
                .build(),
            await this.unitBuilder.reset()
                .name(CONSTANTS.UNIT)
                .abbreviation(CONSTANTS.UNIT)
                .categoryByName(CONSTANTS.UNIT)
                .conversionFactor("1")
                .build(),
        ];
    }

    public async initUnitCategoryTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        const categories = await this.getCategoryEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupUnitCategoryTestDatabase());

        const toInsert: UnitCategory[] = [];
        for(const category of categories){
            const exists = await this.categoryService.findOneByName(category.name);
            if(!exists){
                toInsert.push(category);
            }
        }
        await this.categoryService.insertEntities(toInsert);
    }

    public async initUnitOfMeasureTestDatabase(testContext: DatabaseTestContext): Promise<void> {
        const units = await this.getUnitsOfMeasureEntities(testContext);
        testContext.addCleanupFunction(() => this.cleanupUnitOfMeasureTestDatabase());

        const toInsert: UnitOfMeasure[] = [];
        for(const unit of units){
            const exists = await this.unitService.findOneByName(unit.name);
            if(!exists){
                toInsert.push(unit);
            }
        } 
        await this.unitService.insertEntities(toInsert);
    }

    private async cleanupUnitCategoryTestDatabase(): Promise<void> {
        await this.categoryService.getQueryBuilder().delete().execute();
    }

    private async cleanupUnitOfMeasureTestDatabase(): Promise<void> {
        await this.unitService.getQueryBuilder().delete().execute();
    }

    public async initializeDefaultCategoryBaseUnits(): Promise<void> {
        await await this.setCategoryBaseUnit(CONSTANTS.WEIGHT, CONSTANTS.GRAM);
        await await this.setCategoryBaseUnit(CONSTANTS.VOLUME, CONSTANTS.MILLILITER);
        await await this.setCategoryBaseUnit(CONSTANTS.UNIT, CONSTANTS.UNIT);
    }
    
      
    public async setCategoryBaseUnit(categoryName: string, baseUnitOfMeasure: string): Promise<void> {
        const category = await await this.categoryService.findOneByName(categoryName);
        if(!category){ throw new Error(`${categoryName} category not found.`); }
    
        const baseUnit = await await this.unitService.findOneByName(baseUnitOfMeasure, ['category']);
        if(!baseUnit){ throw new Error("base unit not found"); }
        category.baseUnit = baseUnit;
        
        await await this.categoryService.update(
            category.id,
            {
                name: category.name,
                baseUnitId: category.baseUnit.id 
            } as UpdateUnitCategoryDto
        );
    }
}