import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateUserLocationDto } from '../../dto/update-user-location.dto';
import { UserLocation } from '../../entities/user-location.entity';

@Injectable()
export class UserLocationChangeDetector extends ChangeDetectorBase<UserLocation, UpdateUserLocationDto> {
    detect(entity: UserLocation, dto: UpdateUserLocationDto): ChangeDetectionResult<UpdateUserLocationDto> {
        const patch: MutablePartial<UpdateUserLocationDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(entity.locationId, dto.locationId)) {
            patch.locationId = dto.locationId;
            changes.push({
                op: 'scalar',
                path: 'locationId',
                previousValue: entity.locationId,
                nextValue: dto.locationId,
            });
        }

        const existingRoleIds = (entity.roles ?? [])
            .map((role) => role.id)
            .sort((a, b) => a - b);
        const incomingRoleIds = [...dto.roleIds].sort((a, b) => a - b);

        if (!this.sameNumberArray(existingRoleIds, incomingRoleIds)) {
            patch.roleIds = dto.roleIds;
            changes.push({
                op: 'aggregate',
                path: 'roleIds',
                previousValue: existingRoleIds,
                nextValue: dto.roleIds,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
