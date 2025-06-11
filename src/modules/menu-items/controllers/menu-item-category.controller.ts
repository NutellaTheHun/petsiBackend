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
import {
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_STAFF,
} from '../../roles/utils/constants';
import { CreateMenuItemCategoryDto } from '../dto/menu-item-category/create-menu-item-category.dto';
import { UpdateMenuItemCategoryDto } from '../dto/menu-item-category/update-menu-item-category.dto';
import { MenuItemCategory } from '../entities/menu-item-category.entity';
import { MenuItemCategoryService } from '../services/menu-item-category.service';

@ApiTags('Menu Item Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-categories')
@ApiExtraModels(MenuItemCategory)
export class MenuItemCategoryController extends ControllerBase<MenuItemCategory> {
  constructor(
    categoryService: MenuItemCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      categoryService,
      cacheManager,
      'MenuItemCategoryController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Menu Item Category' })
  @ApiCreatedResponse({
    description: 'Menu Item Category successfully created',
    type: MenuItemCategory,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemCategoryDto })
  async create(
    @Body() dto: CreateMenuItemCategoryDto,
  ): Promise<MenuItemCategory> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Menu Item Category' })
  @ApiOkResponse({
    description: 'Menu Item Category successfully updated',
    type: MenuItemCategory,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({
    description: 'Menu Item Category to update not found.',
  })
  @ApiBody({ type: UpdateMenuItemCategoryDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemCategoryDto,
  ): Promise<MenuItemCategory> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Menu Item Category' })
  @ApiNoContentResponse({
    description: 'Menu Item Category successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Menu Item Category not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Menu Item Categories' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(MenuItemCategory) },
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
  ): Promise<PaginatedResult<MenuItemCategory>> {
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
  @ApiOperation({ summary: 'Retrieves one Menu Item Category' })
  @ApiOkResponse({
    description: 'Menu Item Category found',
    type: MenuItemCategory,
  })
  @ApiNotFoundResponse({ description: 'Menu Item Category not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MenuItemCategory> {
    return super.findOne(id);
  }
}
