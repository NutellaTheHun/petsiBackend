import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateLabelDto } from '../../dto/label/update-label.dto';
import { Label } from '../../entities/label.entity';

@Injectable()
export class LabelChangeDetector extends ChangeDetectorBase<Label, UpdateLabelDto> {
    detect(entity: Label, dto: UpdateLabelDto): ChangeDetectionResult<UpdateLabelDto> {
        const patch: MutablePartial<UpdateLabelDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(entity.imageUrl, dto.imageUrl)) {
            patch.imageUrl = dto.imageUrl;
            changes.push({
                path: 'imageUrl',
                previousValue: entity.imageUrl,
                nextValue: dto.imageUrl,
            });
        }

        const existingMenuItemId = entity.menuItem?.id;
        if (!this.unchanged(existingMenuItemId, dto.menuItemId)) {
            patch.menuItemId = dto.menuItemId;
            changes.push({
                path: 'menuItemId',
                previousValue: existingMenuItemId,
                nextValue: dto.menuItemId,
            });
        }

        const existingLabelTypeId = entity.labelType?.id;
        if (!this.unchanged(existingLabelTypeId, dto.labelTypeId)) {
            patch.labelTypeId = dto.labelTypeId;
            changes.push({
                path: 'labelTypeId',
                previousValue: existingLabelTypeId,
                nextValue: dto.labelTypeId,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
