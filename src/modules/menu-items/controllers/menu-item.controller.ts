import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { CreateMenuItemDto } from "../dto/menu-item/create-menu-item.dto";
import { UpdateMenuItemDto } from "../dto/menu-item/update-menu-item.dto";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemService } from "../services/menu-item.service";

@ApiTags('Menu Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-size')
@ApiExtraModels(MenuItem)
export class MenuItemController extends ControllerBase<MenuItem> {
    constructor(
        itemService: MenuItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(itemService, cacheManager, 'MenuItemController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Menu Item' })
    @ApiCreatedResponse({ description: 'Menu Item successfully created', type: MenuItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateMenuItemDto })
    async create(@Body() dto: CreateMenuItemDto): Promise<MenuItem> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Menu Item' })
    @ApiOkResponse({ description: 'Menu Item successfully updated', type: MenuItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Menu Item to update not found.' })
    @ApiBody({ type: UpdateMenuItemDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemDto): Promise<MenuItem> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Menu Item' })
    @ApiNoContentResponse({ description: 'Menu Item successfully removed' })
    @ApiNotFoundResponse({ description: 'Menu Item not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Menu Items' })
    @ApiOkResponse({ type: PaginatedResult<MenuItem> })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'search', required: false, type: String,
        description: 'search by MenuItem name'
    })
    @ApiQuery({
        name: 'filters',
        required: false,
        isArray: true,
        type: String,
        description: `Filterable fields. Use format: field=value. Available filters:\n
          - **category** (e.g., \`category=5\`)`,
    })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
          - itemName'\n
          - category (by name)`,
    })
    @ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order: ASC or DESC',
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
    ): Promise<PaginatedResult<MenuItem>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, search, filters, undefined, undefined, undefined);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Menu Item' })
    @ApiOkResponse({ description: 'Menu Item found', type: MenuItem })
    @ApiNotFoundResponse({ description: 'Menu Item not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItem> {
        return super.findOne(id);
    }
}