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
                op: 'scalar',
                path: 'name',
                previousValue: entity.name,
                nextValue: dto.name,
            });
        }

        if (!this.unchanged(entity.email, dto.email)) {
            patch.email = dto.email;
            changes.push({
                op: 'scalar',
                path: 'email',
                previousValue: entity.email,
                nextValue: dto.email,
            });
        }

        if (dto.isTenantAdmin !== undefined && !this.unchanged(entity.isTenantAdmin, dto.isTenantAdmin)) {
            patch.isTenantAdmin = dto.isTenantAdmin;
            changes.push({
                op: 'scalar',
                path: 'isTenantAdmin',
                previousValue: entity.isTenantAdmin,
                nextValue: dto.isTenantAdmin,
            });
        }

        if (dto.password !== undefined) {
            patch.password = dto.password;
            changes.push({
                op: 'scalar',
                path: 'password',
                previousValue: '***',
                nextValue: '***',
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
