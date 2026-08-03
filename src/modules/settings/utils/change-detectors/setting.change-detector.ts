import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateSettingDto } from '../../dto/update-setting.dto';
import { Setting } from '../../entities/setting.entity';
import { serializeSettingValue } from '../setting-value.util';

@Injectable()
export class SettingChangeDetector extends ChangeDetectorBase<Setting, UpdateSettingDto> {
    detect(entity: Setting, dto: UpdateSettingDto): ChangeDetectionResult<UpdateSettingDto> {
        const patch: MutablePartial<UpdateSettingDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (dto.value !== undefined) {
            const serialized = serializeSettingValue(entity.valueType, dto.value);
            if (!this.unchanged(entity.value, serialized)) {
                patch.value = dto.value;
                changes.push({
                    op: 'scalar',
                    path: 'value',
                    previousValue: entity.value,
                    nextValue: serialized,
                });
            }
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
