import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateInventoryItemDto } from '../dto/inventory-item/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/inventory-item/update-inventory-item.dto';
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemService } from "../services/inventory-item.service";

@ApiTags('Inventory Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item')
@ApiExtraModels(InventoryItem)
export class InventoryItemController extends ControllerBase<InventoryItem> {
    constructor(
        itemService: InventoryItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(itemService, cacheManager, 'InventoryItemController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Item' })
    @ApiCreatedResponse({ description: 'Inventory Item successfully created', type: InventoryItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryItemDto })
    async create(@Body() dto: CreateInventoryItemDto): Promise<InventoryItem> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Inventory Item' })
    @ApiOkResponse({ description: 'Inventory Item successfully updated', type: InventoryItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Inventory Item to update not found.' })
    @ApiBody({ type: UpdateInventoryItemDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryItemDto): Promise<InventoryItem> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Inventory Item' })
    @ApiNoContentResponse({ description: 'Inventory Item successfully removed' })
    @ApiNotFoundResponse({ description: 'Inventory Item not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Inventory Items' })
    @ApiOkResponse({ type: PaginatedResult<InventoryItem> })
    @ApiQuery({
        name: 'filters',
        required: false,
        isArray: true,
        type: String,
        description: `Filterable fields. Use format: field=value. Available filters:\n
          - ** category ** (e.g., \`category=5\`)\n
          - ** vendor ** (e.g., \`vendor=5\`)`,
    })

    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
          - itemName \n
          - vendor (by name, nulls sorted last)\n
          - category (by name, nulls sorted last)`,
    })

    @ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order: ASC or DESC',
    })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'search', required: false, type: String,
        description: 'search by inventory item name'
    })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
        //@Query('dateBy') dateBy?: string,
        //@Query('startDate') startDate?: string,  // ISO format string
        //@Query('endDate') endDate?: string, // ISO format string
    ): Promise<PaginatedResult<InventoryItem>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, search, filters, undefined, undefined, undefined);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Inventory Item' })
    @ApiOkResponse({ description: 'Inventory Item found', type: InventoryItem })
    @ApiNotFoundResponse({ description: 'Inventory Item not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItem> {
        return super.findOne(id);
    }
}