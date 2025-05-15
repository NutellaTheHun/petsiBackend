import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { Roles } from '../../../util/decorators/PublicRole';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { Role } from '../entities/role.entity';
import { RoleService } from '../services/role.service';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ROLE_ADMIN } from '../utils/constants';
import { PaginatedResult } from '../../../base/paginated-result';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@ApiTags('Role')
@ApiBearerAuth('access-token')
@Roles(ROLE_ADMIN)
@Controller('roles')
export class RoleController extends ControllerBase<Role>{
  constructor(
    rolesService: RoleService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(rolesService, cacheManager, 'RoleController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Role' })
  @ApiCreatedResponse({ description: 'Role successfully created', type: Role })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateRoleDto })
  async create(@Body() dto: CreateRoleDto): Promise<Role> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Role' })
  @ApiOkResponse({ description: 'Role successfully updated', type: Role })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Role to update not found.' })
  @ApiBody({ type: UpdateRoleDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto): Promise<Role> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Role' })
  @ApiNoContentResponse({ description: 'Role successfully removed' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Roles' })
  @ApiOkResponse({ type: PaginatedResult<Role> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<Role>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Role' })
  @ApiOkResponse({ description: 'Role found', type: Role })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Role> {
      return super.findOne(id);
  }
}