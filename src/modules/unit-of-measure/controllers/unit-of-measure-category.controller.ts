import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureCategory } from '../entities/unit-of-measure-category.entity';
import { UnitOfMeasureCategoryService } from '../services/unit-of-measure-category.service';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../util/decorators/PublicRole';
import { ROLE_MANAGER, ROLE_ADMIN } from '../../roles/utils/constants';
import { UpdateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/update-unit-of-measure-category.dto';
import { CreateUnitOfMeasureCategoryDto } from '../dto/unit-of-measure-category/create-unit-of-measure-category.dto';
import { PaginatedResult } from '../../../base/paginated-result';

@ApiTags('Unit of Measure Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('unit-of-measure-category')
export class UnitOfMeasureCategoryController extends ControllerBase<UnitOfMeasureCategory> {
  constructor(
    categoryService: UnitOfMeasureCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ){ super(categoryService, cacheManager, 'UnitCategoryController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Unit Category' })
  @ApiCreatedResponse({ description: 'Unit Category successfully created', type: UnitOfMeasureCategory })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateUnitOfMeasureCategoryDto })
  async create(@Body() dto: CreateUnitOfMeasureCategoryDto): Promise<UnitOfMeasureCategory> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Unit Category' })
  @ApiOkResponse({ description: 'Unit Category successfully updated', type: UnitOfMeasureCategory })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Unit Category to update not found.' })
  @ApiBody({ type: UpdateUnitOfMeasureCategoryDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUnitOfMeasureCategoryDto): Promise<UnitOfMeasureCategory> {
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
  @ApiOkResponse({ type: PaginatedResult<UnitOfMeasureCategory> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<UnitOfMeasureCategory>> {
    return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Unit Category' })
  @ApiOkResponse({ description: 'Unit Category found', type: UnitOfMeasureCategory })
  @ApiNotFoundResponse({ description: 'Unit Category not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UnitOfMeasureCategory> {
    return super.findOne(id);
  }
}