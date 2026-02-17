import { UpdateUnitOfMeasureDto } from "../../dto/unit-of-measure/update-unit-of-measure.dto";
import { UnitOfMeasure } from "../../entities/unit-of-measure.entity";

export function unitOfMeasureToUpdateDto(unitOfMeasure: UnitOfMeasure): UpdateUnitOfMeasureDto {
    return {
        name: unitOfMeasure.name,
        abbreviation: unitOfMeasure.abbreviation,
        conversionFactorToBase: unitOfMeasure.conversionFactorToBase,
        categoryId: unitOfMeasure.category?.id ?? null,
    };
}