import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { CreateInventoryAreaItemDto } from "../dto/inventory-area-item/create-inventory-area-item.dto";
import { UpdateInventoryAreaItemDto } from "../dto/inventory-area-item/update-inventory-area-item.dto";
import { InventoryAreaItem } from "../entities/inventory-area-item.entity";
import { InventoryAreaItemService } from "../services/inventory-area-item.service";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";

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
    ) { super(itemCountService, cacheManager, 'InventoryAreaItemController', requestContextService, logger); }

    /*@Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Area Item' })
    @ApiCreatedResponse({ description: 'Inventory Area Item successfully created', type: InventoryAreaItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryAreaItemDto })*/
    /**
     * Depreciated, only created as a child through {@link InventoryAreaCount}.
     */
    async create(@Body() dto: CreateInventoryAreaItemDto): Promise<InventoryAreaItem> {
        //return super.create(dto);
        throw new BadRequestException();
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