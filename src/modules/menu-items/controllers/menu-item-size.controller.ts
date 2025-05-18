import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { CreateMenuItemSizeDto } from "../dto/menu-item-size/create-menu-item-size.dto";
import { UpdateMenuItemSizeDto } from "../dto/menu-item-size/update-menu-item-size.dto";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItemSizeService } from "../services/menu-item-size.service";

@ApiTags('Menu Item Size')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-size')
export class MenuItemSizeController extends ControllerBase<MenuItemSize>{
  constructor(
    sizeService: MenuItemSizeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(sizeService, cacheManager, 'MenuItemSizeController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Menu Item Size' })
  @ApiCreatedResponse({ description: 'Menu Item Size successfully created', type: MenuItemSize })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemSizeDto })
  async create(@Body() dto: CreateMenuItemSizeDto): Promise<MenuItemSize> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Menu Item Size' })
  @ApiOkResponse({ description: 'Menu Item Size successfully updated', type: MenuItemSize })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item Size to update not found.' })
  @ApiBody({ type: UpdateMenuItemSizeDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemSizeDto): Promise<MenuItemSize> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Menu Item Size' })
  @ApiNoContentResponse({ description: 'Menu Item Size successfully removed' })
  @ApiNotFoundResponse({ description: 'Menu Item Size not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Menu Item Sizes' })
  @ApiOkResponse({ type: PaginatedResult<MenuItemSize> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<MenuItemSize>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Menu Item Size' })
  @ApiOkResponse({ description: 'Menu Item Size found', type: MenuItemSize })
  @ApiNotFoundResponse({ description: 'Menu Item Size not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItemSize> {
      return super.findOne(id);
  }
}