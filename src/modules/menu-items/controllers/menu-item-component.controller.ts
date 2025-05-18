import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { MenuItemComponentService } from "../services/menu-item-component.service";
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { PaginatedResult } from "../../../base/paginated-result";
import { CreateMenuItemComponentDto } from "../dto/menu-item-component/create-menu-item-component.dto";
import { UpdateMenuItemComponentDto } from "../dto/menu-item-component/update-menu-item-component.dto";

@ApiTags('Menu Item Component')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-component')
export class MenuItemComponentController extends ControllerBase<MenuItemComponent>{
  constructor(
    componentService: MenuItemComponentService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(componentService, cacheManager, 'MenuItemComponentController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Menu Item Component' })
  @ApiCreatedResponse({ description: 'Menu Item Component successfully created', type: MenuItemComponent })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemComponentDto })
  async create(@Body() dto: CreateMenuItemComponentDto): Promise<MenuItemComponent> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Menu Item Component' })
  @ApiOkResponse({ description: 'Menu Item Component successfully updated', type: MenuItemComponent })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item Component to update not found.' })
  @ApiBody({ type: UpdateMenuItemComponentDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemComponentDto): Promise<MenuItemComponent> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Menu Item Component' })
  @ApiNoContentResponse({ description: 'Menu Item Component successfully removed' })
  @ApiNotFoundResponse({ description: 'Menu Item Component not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Menu Item Components' })
  @ApiOkResponse({ type: PaginatedResult<MenuItemComponent> })
  async findAll(
    @Query('relations') relations?: string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<MenuItemComponent>> {
    return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Menu Item Component' })
  @ApiOkResponse({ description: 'Menu Item Component found', type: MenuItemComponent })
  @ApiNotFoundResponse({ description: 'Menu Item Component not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItemComponent> {
    return super.findOne(id);
  }
}