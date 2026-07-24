import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateLocationDto } from '../../dto/update-location.dto';
import { Location } from '../../entities/location.entity';

@Injectable()
export class LocationChangeDetector extends ChangeDetectorBase<Location, UpdateLocationDto> {
    detect(entity: Location, dto: UpdateLocationDto): ChangeDetectionResult<UpdateLocationDto> {
        const patch: MutablePartial<UpdateLocationDto> = {};
        const changes: ChangeDetectorChange[] = [];

        const existingTenantId = entity.tenant?.id;
        if (!this.unchanged(existingTenantId, dto.tenantId)) {
            patch.tenantId = dto.tenantId;
            changes.push({
                op: 'reference',
                path: 'tenantId',
                previousValue: existingTenantId,
                nextValue: dto.tenantId,
            });
        }

        if (!this.unchanged(entity.name, dto.name)) {
            patch.name = dto.name;
            changes.push({
                op: 'scalar',
                path: 'name',
                previousValue: entity.name,
                nextValue: dto.name,
            });
        }

        if (!this.unchanged(entity.address, dto.address ?? null)) {
            patch.address = dto.address;
            changes.push({
                op: 'scalar',
                path: 'address',
                previousValue: entity.address,
                nextValue: dto.address,
            });
        }

        if (!this.unchanged(entity.phoneNumber, dto.phoneNumber ?? null)) {
            patch.phoneNumber = dto.phoneNumber;
            changes.push({
                op: 'scalar',
                path: 'phoneNumber',
                previousValue: entity.phoneNumber,
                nextValue: dto.phoneNumber,
            });
        }

        if (!this.unchanged(entity.email, dto.email ?? null)) {
            patch.email = dto.email;
            changes.push({
                op: 'scalar',
                path: 'email',
                previousValue: entity.email,
                nextValue: dto.email,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
