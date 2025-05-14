import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { Roles } from '../../../util/decorators/PublicRole';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';

@Controller('users')
@Roles("admin")
export class UserController extends ControllerBase<User> {
  constructor(
    userService: UserService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(userService, cacheManager, 'UserController', requestContextService, logger); }
}