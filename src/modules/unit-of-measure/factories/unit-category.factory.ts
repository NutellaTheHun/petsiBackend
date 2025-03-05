import { Injectable } from "@nestjs/common";
import { CreateDefaultUnitCategoryDtoValues, CreateUnitCategoryDto } from "../dto/create-unit-category.dto";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";
import { UnitCategory } from "../entities/unit-category.entity";
import { EntityFactory } from "../../../base/entity-factory";
import { UNIT, VOLUME, WEIGHT } from "../utils/constants";

@Injectable()
export class UnitCategoryFactory extends EntityFactory<UnitCategory, CreateUnitCategoryDto, UpdateUnitCategoryDto>{

    constructor() {
        super( UnitCategory, CreateUnitCategoryDto, UpdateUnitCategoryDto, CreateDefaultUnitCategoryDtoValues());
    }

    async getDefaultUnitCategories(): Promise<UnitCategory[]> {
        return [
            this.createEntityInstance({
                name: UNIT,
            }),
            this.createEntityInstance({
                name: VOLUME,
            }),
            this.createEntityInstance({
                name: WEIGHT,
            }),
        ];
    }

    async getTestingUnitCategories(): Promise<UnitCategory[]>{
        return await this.getDefaultUnitCategories();
    }  
}