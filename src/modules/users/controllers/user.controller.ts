import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Roles } from '../../../util/decorators/PublicRole';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';


@Controller('users')
@Roles("admin")
export class UserController extends ControllerBase<User> {
  constructor(
    private readonly userService: UserService,
  ) { super(userService); }
}