import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaCountService } from "../services/inventory-area-count.service";
import { CreateInventoryAreaCountDto } from "../dto/create-inventory-area-count.dto";
import { UpdateInventoryAreaCountDto } from "../dto/update-inventory-area-count.dto";
import { PaginatedResult } from "../../../base/paginated-result";

@ApiTags('Inventory Area Count')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-area-count')
export class InventoryAreaCountController extends ControllerBase<InventoryAreaCount> {
    constructor(
        areaCountService: InventoryAreaCountService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(areaCountService, cacheManager, 'InventoryAreaCountController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates an Inventory Area Count' })
    @ApiCreatedResponse({ description: 'Inventory Area Count successfully created', type: InventoryAreaCount })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryAreaCountDto })
    async create(@Body() dto: CreateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        return super.create(dto);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Updates a Inventory Area Count' })
    @ApiOkResponse({ description: 'Inventory Area Count successfully updated', type: InventoryAreaCount })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Inventory Area Count to update not found.' })
    @ApiBody({ type: UpdateInventoryAreaCountDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryAreaCountDto): Promise<InventoryAreaCount> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Inventory Area Count' })
    @ApiNoContentResponse({ description: 'Inventory Area Count successfully removed' })
    @ApiNotFoundResponse({ description: 'Inventory Area Count not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Inventory Area Count' })
    @ApiOkResponse({ type: PaginatedResult<InventoryAreaCount> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<InventoryAreaCount>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Inventory Area Count' })
    @ApiOkResponse({ description: 'Inventory Area Count found', type: InventoryAreaCount })
    @ApiNotFoundResponse({ description: 'Inventory Area Count not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryAreaCount> {
        return super.findOne(id);
    }
}