import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entities';
import { Roles } from '../../util/decorators/PublicRole';
import { ControllerBase } from '../../base/controller-base';

@Controller('users')
@Roles("admin")
export class UsersController extends ControllerBase<User> {
  constructor(
    private readonly usersService: UsersService,
  ) { super(usersService); }
}