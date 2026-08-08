import { Injectable } from '@nestjs/common';
import {
    ChangeDetectionResult,
    ChangeDetectorBase,
    ChangeDetectorChange,
    MutablePartial,
} from '../../../../common/base/change-detector.base';
import { UpdateTenantDto } from '../../dto/update-tenant.dto';
import { Tenant } from '../../entities/tenant.entity';

@Injectable()
export class TenantChangeDetector extends ChangeDetectorBase<Tenant, UpdateTenantDto> {
    detect(entity: Tenant, dto: UpdateTenantDto): ChangeDetectionResult<UpdateTenantDto> {
        const patch: MutablePartial<UpdateTenantDto> = {};
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

        if (!this.unchanged(entity.subdomain, dto.subdomain)) {
            patch.subdomain = dto.subdomain;
            changes.push({
                op: 'scalar',
                path: 'subdomain',
                previousValue: entity.subdomain,
                nextValue: dto.subdomain,
            });
        }

        return {
            patch,
            hasChanges: changes.length > 0,
            changes,
        };
    }
}
