import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Inject} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entities';

@Controller('users')
export class UsersController {
  constructor(
    @Inject()
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User | null> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    return await this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<User | null> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
    return await this.usersService.remove(id);
  }
}
