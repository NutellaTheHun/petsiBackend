import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemCategoryService } from "../services/menu-item-category.service";
import { PaginatedResult } from "../../../base/paginated-result";
import { CreateMenuItemCategoryDto } from "../dto/create-menu-item-category.dto";
import { UpdateMenuItemCategoryDto } from "../dto/update-menu-item-category.dto";

@ApiTags('Menu Item Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-category')
export class MenuItemCategoryController extends ControllerBase<MenuItemCategory>{
  constructor(
    categoryService: MenuItemCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(categoryService, cacheManager, 'MenuItemCategoryController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Menu Item Category' })
  @ApiCreatedResponse({ description: 'Menu Item Category successfully created', type: MenuItemCategory })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemCategoryDto })
  async create(@Body() dto: CreateMenuItemCategoryDto): Promise<MenuItemCategory> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Menu Item Category' })
  @ApiOkResponse({ description: 'Menu Item Category successfully updated', type: MenuItemCategory })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item Category to update not found.' })
  @ApiBody({ type: UpdateMenuItemCategoryDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemCategoryDto): Promise<MenuItemCategory> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Menu Item Category' })
  @ApiNoContentResponse({ description: 'Menu Item Category successfully removed' })
  @ApiNotFoundResponse({ description: 'Menu Item Category not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Menu Item Categories' })
  @ApiOkResponse({ type: PaginatedResult<MenuItemCategory> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<MenuItemCategory>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Menu Item Category' })
  @ApiOkResponse({ description: 'Menu Item Category found', type: MenuItemCategory })
  @ApiNotFoundResponse({ description: 'Menu Item Category not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItemCategory> {
      return super.findOne(id);
  }
}