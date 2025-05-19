import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER } from "../../roles/utils/constants";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { InventoryItemVendorService } from "../services/inventory-item-vendor.service";
import { PaginatedResult } from "../../../base/paginated-result";
import { CreateInventoryItemVendorDto } from "../dto/inventory-item-vendor/create-inventory-item-vendor.dto";
import { UpdateInventoryItemVendorDto } from "../dto/inventory-item-vendor/update-inventory-item-vendor.dto";

@ApiTags('Inventory Item Vendor')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item-vendor')
export class InventoryItemVendorController extends ControllerBase<InventoryItemVendor> {
    constructor(
        vendorService: InventoryItemVendorService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ){ super(vendorService, cacheManager, 'InventoryItemVendorController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Item Vendor' })
    @ApiCreatedResponse({ description: 'Inventory Item Vendor successfully created', type: InventoryItemVendor })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryItemVendorDto })
    async create(@Body() dto: CreateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Inventory Item Vendor' })
    @ApiOkResponse({ description: 'Inventory Item Vendor successfully updated', type: InventoryItemVendor })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Inventory Item Vendor to update not found.' })
    @ApiBody({ type: UpdateInventoryItemVendorDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryItemVendorDto): Promise<InventoryItemVendor> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Inventory Item Vendor' })
    @ApiNoContentResponse({ description: 'Inventory Item Vendor successfully removed' })
    @ApiNotFoundResponse({ description: 'Inventory Item Vendor not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Inventory Item Vendors' })
    @ApiOkResponse({ type: PaginatedResult<InventoryItemVendor> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<InventoryItemVendor>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Inventory Item Vendor' })
    @ApiOkResponse({ description: 'Inventory Item Vendor found', type: InventoryItemVendor })
    @ApiNotFoundResponse({ description: 'Inventory Item Vendor not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<InventoryItemVendor> {
        return super.findOne(id);
    }
}