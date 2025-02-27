import { Injectable } from "@nestjs/common";
import { EntityFactory } from "../../../base/entity-factory";
import { CreateDefaultUnitOfMeasureDtoValues, CreateUnitOfMeasureDto } from "../dto/create-unit-of-measure.dto";
import { UnitOfMeasure } from "../entities/unit-of-measure.entity";
import { UpdateUnitOfMeasureDto } from "../dto/update-unit-of-measure.dto";

@Injectable()
export class UnitOfMeasureFactory extends EntityFactory<UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto>{

    constructor() {
        super( UnitOfMeasure, CreateUnitOfMeasureDto, UpdateUnitOfMeasureDto, CreateDefaultUnitOfMeasureDtoValues());
    }

    // name: string
    // abreviation: string
    // category entity: UnitCategory
    // conversionFactorBase?: string
    getDefaultRoles(): UnitOfMeasure[] {
        return [
            
        ];
    }

    getTestingRoles(): UnitOfMeasure[]{
        return this.getDefaultRoles();
    }  
}