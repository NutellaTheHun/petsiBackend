import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { Roles } from '../../../util/decorators/PublicRole';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { Role } from '../entities/role.entity';
import { RoleService } from '../services/role.service';

@Controller('roles')
@Roles("admin")
export class RoleController extends ControllerBase<Role>{
  constructor(
    rolesService: RoleService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(rolesService, cacheManager, 'RoleController', requestContextService, logger); }
}