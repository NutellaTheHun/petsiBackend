import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Cache } from 'cache-manager';
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateInventoryItemCategoryDto } from '../dto/inventory-item-category/create-inventory-item-category.dto';
import { UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/update-inventory-item-category.dto';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';

@ApiTags('Inventory Item Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item-categories')
@ApiExtraModels(InventoryItemCategory)
export class InventoryItemCategoryController extends ControllerBase<InventoryItemCategory> {
  constructor(
    categoryService: InventoryItemCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      categoryService,
      cacheManager,
      'InventoryItemCategoryController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Inventory Item Category' })
  @ApiCreatedResponse({
    description: 'Inventory Item Category successfully created',
    type: InventoryItemCategory,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateInventoryItemCategoryDto })
  async create(
    @Body() dto: CreateInventoryItemCategoryDto,
  ): Promise<InventoryItemCategory> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Inventory Item Category' })
  @ApiOkResponse({
    description: 'Inventory Item Category successfully updated',
    type: InventoryItemCategory,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({
    description: 'Inventory Item Category to update not found.',
  })
  @ApiBody({ type: UpdateInventoryItemCategoryDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemCategoryDto,
  ): Promise<InventoryItemCategory> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Inventory Item Category' })
  @ApiNoContentResponse({
    description: 'Inventory Item Category successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Inventory Item Category not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Inventory Item Categories' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(InventoryItemCategory) },
        },
        nextCursor: {
          type: 'string',
          example: '2',
        },
      },
    },
  })
  @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: `Field to sort by. Available options:\n
              - categoryName`,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order: ASC or DESC',
  })
  async findAll(
    @Query('relations') relations?: string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    //@Query('search') search?: string,
    //@Query('filters') filters?: string[],
    //@Query('dateBy') dateBy?: string,
    //@Query('startDate') startDate?: string,  // ISO format string
    //@Query('endDate') endDate?: string, // ISO format string
  ): Promise<PaginatedResult<InventoryItemCategory>> {
    return super.findAll(
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Inventory Item Category' })
  @ApiOkResponse({
    description: 'Inventory Item Category found',
    type: InventoryItemCategory,
  })
  @ApiNotFoundResponse({ description: 'Inventory Item Category not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryItemCategory> {
    return super.findOne(id);
  }
}
