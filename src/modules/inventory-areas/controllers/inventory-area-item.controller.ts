import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { RequestContextService } from "../../request-context/RequestContextService";
import { AppLogger } from "../../app-logging/app-logger";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { Roles } from "../../../util/decorators/PublicRole";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { PaginatedResult } from "../../../base/paginated-result";
import { CreateInventoryAreaItemDto } from "../dto/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/update-inventory-area-item.dto";

@ApiTags('Inventory Area Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-area-item')
export class InventoryAreaItemController extends ControllerBase<InventoryAreaItem> {
    constructor(
        itemCountService: InventoryAreaItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(itemCountService, cacheManager, 'InventoryAreaItemController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Area Item' })
    @ApiCreatedResponse({ description: 'Inventory Area Item successfully created', type: InventoryAreaItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryAreaItemDto })
    async create(@Body() dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Inventory Area Item' })
    @ApiOkResponse({ description: 'Inventory Area Item successfully updated', type: InventoryAreaItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Inventory Area Item to update not found.' })
    @ApiBody({ type: UpdateInventoryAreaItemDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Inventory Area Item' })
    @ApiNoContentResponse({ description: 'Inventory Area Item successfully removed' })
    @ApiNotFoundResponse({ description: 'Inventory Area Item not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Inventory Area Items' })
    @ApiOkResponse({ type: PaginatedResult<InventoryAreaItem> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<InventoryAreaItem>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Inventory Area Item' })
    @ApiOkResponse({ description: 'Inventory Area Item found', type: InventoryAreaItem })
    @ApiNotFoundResponse({ description: 'Inventory Area Item not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryAreaItem> {
        return super.findOne(id);
    }
}