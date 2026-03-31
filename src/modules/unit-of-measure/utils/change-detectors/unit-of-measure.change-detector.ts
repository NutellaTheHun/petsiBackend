import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateUnitOfMeasureDto } from '../../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';

@Injectable()
export class UnitOfMeasureChangeDetector extends ChangeDetectorBase<
    UnitOfMeasure,
    UpdateUnitOfMeasureDto
> {
    detect(
        entity: UnitOfMeasure,
        dto: UpdateUnitOfMeasureDto,
    ): ChangeDetectionResult<UpdateUnitOfMeasureDto> {
        const patch: MutablePartial<UpdateUnitOfMeasureDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(entity.name, dto.name)) {
            patch.name = dto.name;
            changes.push({
                op: 'scalar',
                path: 'name',
                previousValue: entity.name,
                nextValue: dto.name,
            });
        }

        if (!this.unchanged(entity.abbreviation, dto.abbreviation)) {
            patch.abbreviation = dto.abbreviation;
            changes.push({
                op: 'scalar',
                path: 'abbreviation',
                previousValue: entity.abbreviation,
                nextValue: dto.abbreviation,
            });
        }

        if (!this.unchanged(entity.conversionFactorToBase, dto.conversionFactorToBase)) {
            patch.conversionFactorToBase = dto.conversionFactorToBase;
            changes.push({
                op: 'scalar',
                path: 'conversionFactorToBase',
                previousValue: entity.conversionFactorToBase,
                nextValue: dto.conversionFactorToBase,
            });
        }

        const existingCategoryId = entity.category?.id ?? null;
        if (!this.unchanged(existingCategoryId, dto.categoryId)) {
            patch.categoryId = dto.categoryId;
            changes.push({
                op: 'reference',
                path: 'categoryId',
                previousValue: existingCategoryId,
                nextValue: dto.categoryId,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
