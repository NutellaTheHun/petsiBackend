import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entities';
import { Roles } from '../../util/decorators/PublicRole';
import { ControllerBase } from '../../base/controller-base';

@Controller('users')
@Roles("admin")
export class UserController extends ControllerBase<User> {
  constructor(
    private readonly userService: UserService,
  ) { super(userService); }
}