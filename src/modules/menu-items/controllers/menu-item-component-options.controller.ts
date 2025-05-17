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
import { CreateMenuItemComponentOptionsDto } from "../dto/create-menu-item-component-options.dto";
import { UpdateMenuItemComponentOptionsDto } from "../dto/update-menu-item-component-options.dto";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { MenuItemComponentOptionsService } from "../services/menu-item-component-options.service";

@ApiTags('Menu Item Component Options')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-component-options')
export class MenuItemComponentOptionsController extends ControllerBase<MenuItemComponentOptions>{
  constructor(
    optionsService: MenuItemComponentOptionsService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(optionsService, cacheManager, 'MenuItemSizeController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates Menu Item Component Options' })
  @ApiCreatedResponse({ description: 'Menu Item Component Options created', type: MenuItemComponentOptions })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemComponentOptionsDto })
  async create(@Body() dto: CreateMenuItemComponentOptionsDto): Promise<MenuItemComponentOptions> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates Menu Item Component Options' })
  @ApiOkResponse({ description: 'Menu Item Component Options successfully updated', type: MenuItemComponentOptions })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item Component Options to update not found.' })
  @ApiBody({ type: UpdateMenuItemComponentOptionsDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemComponentOptionsDto): Promise<MenuItemComponentOptions> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes Menu Item Component Options' })
  @ApiNoContentResponse({ description: 'Menu Item Component Options successfully removed' })
  @ApiNotFoundResponse({ description: 'Menu Item Component Options not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Menu Item Component Options' })
  @ApiOkResponse({ type: PaginatedResult<MenuItemComponentOptions> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<MenuItemComponentOptions>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves Menu Item Component Options' })
  @ApiOkResponse({ description: 'Menu Item Component Options found', type: MenuItemComponentOptions })
  @ApiNotFoundResponse({ description: 'Menu Item Component Options not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItemComponentOptions> {
      return super.findOne(id);
  }
}