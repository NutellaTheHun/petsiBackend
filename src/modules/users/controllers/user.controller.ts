import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN } from '../../roles/utils/constants';
import { User } from '../entities/user.entities';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Roles( ROLE_ADMIN)
@Controller('users')
export class UserController extends ControllerBase<User> {
  constructor(
    userService: UserService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(userService, cacheManager, 'UserController', requestContextService, logger); }

  @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a User' })
    @ApiCreatedResponse({ description: 'User successfully created', type: User })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateUserDto })
    async create(@Body() dto: CreateUserDto): Promise<User>  {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a User' })
    @ApiOkResponse({ description: 'User successfully updated', type: User })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'User to update not found.' })
    @ApiBody({ type: UpdateUserDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto): Promise<User>  {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a User' })
    @ApiNoContentResponse({ description: 'User successfully removed' })
    @ApiNotFoundResponse({ description: 'User not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Users' })
    @ApiOkResponse({ type: PaginatedResult<User>  })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<User>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one User' })
    @ApiOkResponse({ description: 'User found', type: User })
    @ApiNotFoundResponse({ description: 'User not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<User>  {
        return super.findOne(id);
    }
}