import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateUnitOfMeasureCategoryDto } from '../../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { UnitOfMeasureCategory } from '../../entities/unit-of-measure-category.entity';

@Injectable()
export class UnitOfMeasureCategoryChangeDetector extends ChangeDetectorBase<
    UnitOfMeasureCategory,
    UpdateUnitOfMeasureCategoryDto
> {
    detect(
        entity: UnitOfMeasureCategory,
        dto: UpdateUnitOfMeasureCategoryDto,
    ): ChangeDetectionResult<UpdateUnitOfMeasureCategoryDto> {
        const patch: MutablePartial<UpdateUnitOfMeasureCategoryDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(entity.name, dto.name)) {
            patch.name = dto.name;
            changes.push({
                path: 'name',
                previousValue: entity.name,
                nextValue: dto.name,
            });
        }

        const existingBaseUnitId = entity.baseConversionUnit?.id ?? null;
        if (!this.unchanged(existingBaseUnitId, dto.baseConversionUnitId)) {
            patch.baseConversionUnitId = dto.baseConversionUnitId;
            changes.push({
                path: 'baseConversionUnitId',
                previousValue: existingBaseUnitId,
                nextValue: dto.baseConversionUnitId,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
