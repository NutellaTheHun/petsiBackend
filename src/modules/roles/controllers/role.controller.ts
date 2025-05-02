import { Controller, Inject } from '@nestjs/common';
import { Role } from '../entities/role.entities';
import { Roles } from '../../../util/decorators/PublicRole';
import { ControllerBase } from '../../../base/controller-base';
import { RoleService } from '../services/role.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('roles')
@Roles("admin")
export class RoleController extends ControllerBase<Role>{
  constructor(
    rolesService: RoleService,
    @Inject(CACHE_MANAGER) cacheManager: Cache
  ) { super(rolesService, cacheManager); }
}