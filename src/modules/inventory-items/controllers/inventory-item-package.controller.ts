import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemPackageService } from "../services/inventory-item-package.service";
import { PaginatedResult } from "../../../base/paginated-result";
import { CreateInventoryItemPackageDto } from "../dto/inventory-item-package/create-inventory-item-package.dto";
import { UpdateInventoryItemPackageDto } from "../dto/inventory-item-package/update-inventory-item-package.dto";

@ApiTags('Inventory Item Package')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item-package')
export class InventoryItemPackageController extends ControllerBase<InventoryItemPackage> {
    constructor(

      packageService: InventoryItemPackageService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ){ super(packageService, cacheManager, 'InventoryItemPackageController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Inventory Item Package' })
  @ApiCreatedResponse({ description: 'Inventory Item Package successfully created', type: InventoryItemPackage })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateInventoryItemPackageDto })
  async create(@Body() dto: CreateInventoryItemPackageDto): Promise<InventoryItemPackage> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Inventory Item Package' })
  @ApiOkResponse({ description: 'Inventory Item Package successfully updated', type: InventoryItemPackage })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Inventory Item Package to update not found.' })
  @ApiBody({ type: UpdateInventoryItemPackageDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryItemPackageDto): Promise<InventoryItemPackage> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Inventory Item Package' })
  @ApiNoContentResponse({ description: 'Inventory Item Package successfully removed' })
  @ApiNotFoundResponse({ description: 'Inventory Item Package not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Inventory Item Packages' })
  @ApiOkResponse({ type: PaginatedResult<InventoryItemPackage> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<InventoryItemPackage>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Inventory Item Package' })
  @ApiOkResponse({ description: 'Inventory Item Package found', type: InventoryItemPackage })
  @ApiNotFoundResponse({ description: 'Inventory Item Package not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemPackage> {
      return super.findOne(id);
  }
}