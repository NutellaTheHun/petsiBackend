import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
