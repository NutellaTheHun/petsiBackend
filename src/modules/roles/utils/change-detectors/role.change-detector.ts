import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateRoleDto } from '../../dto/update-role.dto';
import { Role } from '../../entities/role.entity';

@Injectable()
export class RoleChangeDetector extends ChangeDetectorBase<Role, UpdateRoleDto> {
    detect(entity: Role, dto: UpdateRoleDto): ChangeDetectionResult<UpdateRoleDto> {
        const patch: MutablePartial<UpdateRoleDto> = {};
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

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
