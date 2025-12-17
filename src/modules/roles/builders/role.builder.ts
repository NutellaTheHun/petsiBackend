import { BuilderBase } from '../../../base/builder-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entity';

export class RoleBuilder extends BuilderBase<Role> {
  constructor(requestContextService: RequestContextService, logger: AppLogger) {
    super(Role, 'RoleBuilder', requestContextService, logger);
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
    return this.setPropByVal('roleName', name);
  }
}
