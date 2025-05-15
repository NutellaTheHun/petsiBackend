import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { UpdateMenuItemSizeDto } from "../../menu-items/dto/update-menu-item-size.dto";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { CreateInventoryItemSizeDto } from "../dto/create-inventory-item-size.dto";
import { UpdateInventoryItemSizeDto } from "../dto/update-inventory-item-size.dto";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { InventoryItemSizeService } from "../services/inventory-item-size.service";

@ApiTags('Inventory Item Size')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item-size')
export class InventoryItemSizeController extends ControllerBase<InventoryItemSize> {
    constructor(

      sizeService: InventoryItemSizeService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ){ super(sizeService, cacheManager, 'InventoryItemSizeController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Inventory Item Size' })
  @ApiCreatedResponse({ description: 'Inventory Item Size successfully created', type: InventoryItemSize })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateInventoryItemSizeDto })
  async create(@Body() dto: CreateInventoryItemSizeDto): Promise<InventoryItemSize> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Inventory Item Size' })
  @ApiOkResponse({ description: 'Inventory Item Size successfully updated', type: InventoryItemSize })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Inventory Item Size to update not found.' })
  @ApiBody({ type: UpdateMenuItemSizeDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryItemSizeDto): Promise<InventoryItemSize> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Inventory Item Size' })
  @ApiNoContentResponse({ description: 'Inventory Item Size successfully removed' })
  @ApiNotFoundResponse({ description: 'Inventory Item Size not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Inventory Item Sizes' })
  @ApiOkResponse({ type: PaginatedResult<InventoryItemSize> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<InventoryItemSize>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Inventory Item Size' })
  @ApiOkResponse({ description: 'Inventory Item Size found', type: InventoryItemSize })
  @ApiNotFoundResponse({ description: 'Inventory Item Size not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemSize> {
      return super.findOne(id);
  }
}