import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemCategoryService } from "../services/inventory-item-category.service";
import { Roles } from "../../../util/decorators/PublicRole";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { CreateInventoryItemCategoryDto } from "../dto/create-inventory-item-category.dto";
import { UpdateInventoryItemCategoryDto } from "../dto/update-inventory-item-category.dto";
import { PaginatedResult } from "../../../base/paginated-result";

@ApiTags('Inventory Item Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item-category')
export class InventoryItemCategoryController extends ControllerBase<InventoryItemCategory> {
    constructor(
      categoryService: InventoryItemCategoryService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ){ super(categoryService, cacheManager, 'InventoryItemCategoryController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Item Category' })
    @ApiCreatedResponse({ description: 'Inventory Item Category successfully created', type: InventoryItemCategory })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryItemCategoryDto })
    async create(@Body() dto: CreateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Inventory Item Category' })
    @ApiOkResponse({ description: 'Inventory Item Category successfully updated', type: InventoryItemCategory })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Inventory Item Category to update not found.' })
    @ApiBody({ type: UpdateInventoryItemCategoryDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryItemCategoryDto): Promise<InventoryItemCategory> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Inventory Item Category' })
    @ApiNoContentResponse({ description: 'Inventory Item Category successfully removed' })
    @ApiNotFoundResponse({ description: 'Inventory Item Category not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Inventory Item Categories' })
    @ApiOkResponse({ type: PaginatedResult<InventoryItemCategory> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<InventoryItemCategory>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Inventory Item Category' })
    @ApiOkResponse({ description: 'Inventory Item Category found', type: InventoryItemCategory })
    @ApiNotFoundResponse({ description: 'Inventory Item Category not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemCategory> {
        return super.findOne(id);
    }
}