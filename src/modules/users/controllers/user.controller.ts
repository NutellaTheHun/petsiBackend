import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Roles } from '../../../util/decorators/PublicRole';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('users')
@Roles("admin")
export class UserController extends ControllerBase<User> {
  constructor(
    userService: UserService,
    @Inject(CACHE_MANAGER) cacheManager: Cache
  ) { super(userService, cacheManager); }
}