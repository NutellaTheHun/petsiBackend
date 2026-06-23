import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateLabelTypeDto } from '../../dto/label-type/update-label-type.dto';
import { LabelType } from '../../entities/label-type.entity';

@Injectable()
export class LabelTypeChangeDetector extends ChangeDetectorBase<
    LabelType,
    UpdateLabelTypeDto
> {
    detect(
        entity: LabelType,
        dto: UpdateLabelTypeDto,
    ): ChangeDetectionResult<UpdateLabelTypeDto> {
        const patch: MutablePartial<UpdateLabelTypeDto> = {};
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

        if (!this.unchanged(entity.length, dto.length)) {
            patch.length = dto.length;
            changes.push({
                op: 'scalar',
                path: 'length',
                previousValue: entity.length,
                nextValue: dto.length,
            });
        }

        if (!this.unchanged(entity.width, dto.width)) {
            patch.width = dto.width;
            changes.push({
                op: 'scalar',
                path: 'width',
                previousValue: entity.width,
                nextValue: dto.width,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
