import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { User } from '../../entities/user.entities';

@Injectable()
export class UserChangeDetector extends ChangeDetectorBase<User, UpdateUserDto> {
    detect(entity: User, dto: UpdateUserDto): ChangeDetectionResult<UpdateUserDto> {
        const patch: MutablePartial<UpdateUserDto> = {};
        const changes: ChangeDetectorChange[] = [];

        if (!this.unchanged(entity.name, dto.name)) {
            patch.name = dto.name;
            changes.push({
                path: 'name',
                previousValue: entity.name,
                nextValue: dto.name,
            });
        }

        if (!this.unchanged(entity.email, dto.email)) {
            patch.email = dto.email;
            changes.push({
                path: 'email',
                previousValue: entity.email,
                nextValue: dto.email,
            });
        }

        if (dto.password !== undefined) {
            patch.password = dto.password;
            changes.push({
                path: 'password',
                previousValue: '***',
                nextValue: '***',
            });
        }

        const existingRoleIds = (entity.roles ?? [])
            .map((role) => role.id)
            .sort((a, b) => a - b);
        const incomingRoleIds = [...dto.roleIds].sort((a, b) => a - b);

        if (!this.sameNumberArray(existingRoleIds, incomingRoleIds)) {
            patch.roleIds = dto.roleIds;
            changes.push({
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
