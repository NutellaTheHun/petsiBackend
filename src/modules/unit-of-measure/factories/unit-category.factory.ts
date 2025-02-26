import { Injectable } from "@nestjs/common";
import { CreateDefaultUnitCategoryDtoValues, CreateUnitCategoryDto } from "../dto/create-unit-category.dto";
import { UpdateUnitCategoryDto } from "../dto/update-unit-category.dto";
import { UnitCategory } from "../entities/unit-category.entity";
import { EntityFactory } from "../../../base/entity-factory";

@Injectable()
export class UnitCategoryFactory extends EntityFactory<UnitCategory, CreateUnitCategoryDto, UpdateUnitCategoryDto>{

    constructor() {
        super( UnitCategory, CreateUnitCategoryDto, UpdateUnitCategoryDto, CreateDefaultUnitCategoryDtoValues());
    }

    getDefaultRoles(): UnitCategory[] {
        return [
            this.createEntityInstance({name: "unit"}),
            this.createEntityInstance({name: "volume"}),
            this.createEntityInstance({name: "weight"}),
        ];
    }

    getTestingRoles(): UnitCategory[]{
        return this.getDefaultRoles();
    }  
}