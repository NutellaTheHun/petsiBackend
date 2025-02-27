import { Controller } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entities';
import { Roles } from '../../util/decorators/PublicRole';
import { ControllerBase } from '../../base/controller-base';

@Controller('roles')
@Roles("admin")
export class RolesController extends ControllerBase<Role>{
  constructor(
    private readonly rolesService: RolesService
  ) { super(rolesService); }
}
