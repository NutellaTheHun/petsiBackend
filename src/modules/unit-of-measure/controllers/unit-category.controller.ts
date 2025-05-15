import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitCategory } from '../entities/unit-category.entity';
import { UnitCategoryService } from '../services/unit-category.service';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../util/decorators/PublicRole';
import { ROLE_MANAGER, ROLE_ADMIN } from '../../roles/utils/constants';
import { UpdateUnitCategoryDto } from '../dto/update-unit-category.dto';
import { CreateUnitCategoryDto } from '../dto/create-unit-category.dto';
import { PaginatedResult } from '../../../base/paginated-result';

@ApiTags('Unit Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('unit-category')
export class UnitCategoryController extends ControllerBase<UnitCategory> {
  constructor(
    categoryService: UnitCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ){ super(categoryService, cacheManager, 'UnitCategoryController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Unit Category' })
  @ApiCreatedResponse({ description: 'Unit Category successfully created', type: UnitCategory })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateUnitCategoryDto })
  async create(@Body() dto: CreateUnitCategoryDto): Promise<UnitCategory> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Unit Category' })
  @ApiOkResponse({ description: 'Unit Category successfully updated', type: UnitCategory })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Unit Category to update not found.' })
  @ApiBody({ type: UpdateUnitCategoryDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUnitCategoryDto): Promise<UnitCategory> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Unit Category' })
  @ApiNoContentResponse({ description: 'Unit Category successfully removed' })
  @ApiNotFoundResponse({ description: 'Unit Category not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Unit Categories' })
  @ApiOkResponse({ type: PaginatedResult<UnitCategory> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<UnitCategory>> {
    return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Unit Category' })
  @ApiOkResponse({ description: 'Unit Category found', type: UnitCategory })
  @ApiNotFoundResponse({ description: 'Unit Category not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UnitCategory> {
    return super.findOne(id);
  }
}