import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemService } from "../services/menu-item.service";
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { PaginatedResult } from "../../../base/paginated-result";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";

@ApiTags('Menu Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-size')
export class MenuItemController extends ControllerBase<MenuItem>{
  constructor(
    itemService: MenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(itemService, cacheManager, 'MenuItemController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Menu Item' })
  @ApiCreatedResponse({ description: 'Menu Item successfully created', type: MenuItem })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemDto })
  async create(@Body() dto: CreateMenuItemDto): Promise<MenuItem> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Menu Item' })
  @ApiOkResponse({ description: 'Menu Item successfully updated', type: MenuItem })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item to update not found.' })
  @ApiBody({ type: UpdateMenuItemDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemDto): Promise<MenuItem> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Menu Item' })
  @ApiNoContentResponse({ description: 'Menu Item successfully removed' })
  @ApiNotFoundResponse({ description: 'Menu Item not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Menu Items' })
  @ApiOkResponse({ type: PaginatedResult<MenuItem> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<MenuItem>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Menu Item' })
  @ApiOkResponse({ description: 'Menu Item found', type: MenuItem })
  @ApiNotFoundResponse({ description: 'Menu Item not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItem> {
      return super.findOne(id);
  }
}