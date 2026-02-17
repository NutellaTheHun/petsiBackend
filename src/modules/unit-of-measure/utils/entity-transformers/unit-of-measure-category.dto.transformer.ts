import { UpdateUnitOfMeasureCategoryDto } from "../../dto/unit-of-measure-category/update-unit-of-measure-category.dto";
import { UnitOfMeasureCategory } from "../../entities/unit-of-measure-category.entity";

export function unitOfMeasureCategoryToUpdateDto(unitOfMeasureCategory: UnitOfMeasureCategory): UpdateUnitOfMeasureCategoryDto {
    return {
        name: unitOfMeasureCategory.name,
        baseConversionUnitId: unitOfMeasureCategory.baseConversionUnit?.id ?? null,
    };
}