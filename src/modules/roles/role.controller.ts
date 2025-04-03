import { Controller } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './entities/role.entities';
import { Roles } from '../../util/decorators/PublicRole';
import { ControllerBase } from '../../base/controller-base';

@Controller('roles')
@Roles("admin")
export class RoleController extends ControllerBase<Role>{
  constructor(
    private readonly rolesService: RoleService
  ) { super(rolesService); }
}
