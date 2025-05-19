import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreaService } from "../services/inventory-area.service";
import { CreateInventoryAreaDto } from "../dto/inventory-area/create-inventory-area.dto";
import { UpdateInventoryAreaDto } from "../dto/inventory-area/update-inventory-area.dto";
import { PaginatedResult } from "../../../base/paginated-result";

@ApiTags('Inventory Area')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-area')
export class InventoryAreaController extends ControllerBase<InventoryArea> {
    constructor(
        areaService: InventoryAreaService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(areaService, cacheManager, 'InventoryAreaController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Area' })
    @ApiCreatedResponse({ description: 'Inventory Area successfully created', type: InventoryArea })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryAreaDto })
    async create(@Body() dto: CreateInventoryAreaDto): Promise<InventoryArea> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Inventory Area' })
    @ApiOkResponse({ description: 'Inventory Area successfully updated', type: InventoryArea })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Inventory Area to update not found.' })
    @ApiBody({ type: UpdateInventoryAreaDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryAreaDto): Promise<InventoryArea> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Inventory Area' })
    @ApiNoContentResponse({ description: 'Inventory Area successfully removed' })
    @ApiNotFoundResponse({ description: 'Inventory Area not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Inventory Areas' })
    @ApiOkResponse({ type: PaginatedResult<InventoryArea> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<InventoryArea>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Inventory Area' })
    @ApiOkResponse({ description: 'Inventory Area found', type: InventoryArea })
    @ApiNotFoundResponse({ description: 'Inventory Area not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryArea> {
        return super.findOne(id);
    }
}