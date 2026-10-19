import { BuilderBase } from '../../../common/base/builder.base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';

export class RoleBuilder extends BuilderBase<Role> {
    constructor(requestContextService: RequestContextService) {
        super(Role, 'RoleBuilder', requestContextService);
    }

    protected createEntity(dto: CreateRoleDto): void {
        if (dto.name !== undefined) {
            this.roleName(dto.name);
        }
    }

    protected updateEntity(dto: UpdateRoleDto): void {
        if (dto.name !== undefined) {
            this.roleName(dto.name);
        }
    }

    public roleName(name: string): this {
        return this.setPropByVal('name', name);
    }

    public tenantId(tenantId: number): this {
        return this.setPropByVal('tenantId', tenantId);
    }
}
