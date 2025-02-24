import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from '../users/users.service';
import { Role } from './entities/role.entities';

@Controller('roles')
export class RolesController {
  constructor(
    //@Inject(forwardRef(() => UsersService))
    private readonly rolesService: RolesService
  ) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<Role | null> {
    return await this.rolesService.create(createRoleDto);
  }

  @Get()
  async findAll(): Promise<Role[]> {
    return await this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Role | null> {
    return await this.rolesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto): Promise<Role | null> {
    return await this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Boolean> {
    return await this.rolesService.remove(id);
  }
}
