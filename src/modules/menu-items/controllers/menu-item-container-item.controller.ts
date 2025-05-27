import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { CreateMenuItemContainerItemDto } from "../dto/menu-item-container-item/create-menu-item-container-item.dto";
import { UpdateMenuItemContainerItemDto } from "../dto/menu-item-container-item/update-menu-item-container-item.dto";
import { MenuItemContainerItem } from "../entities/menu-item-container-item.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemContainerItemService } from "../services/menu-item-container-item.service";

@ApiTags('Menu Item Container Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-container-item')
@ApiExtraModels(MenuItemContainerItem)
export class MenuItemContainerItemController extends ControllerBase<MenuItemContainerItem> {
    constructor(
        componentService: MenuItemContainerItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(componentService, cacheManager, 'MenuItemComponentController', requestContextService, logger); }

    /*@Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Menu Item Component' })
    @ApiCreatedResponse({ description: 'Menu Item Component successfully created', type: MenuItemContainerItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateMenuItemContainerItemDto })*/
    /**
     * Depreciated, only created as a child through {@link MenuItem}.
     */
    async create(@Body() dto: CreateMenuItemContainerItemDto): Promise<MenuItemContainerItem> {
        //return super.create(dto);
        throw new BadRequestException();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Menu Item Component' })
    @ApiOkResponse({ description: 'Menu Item Component successfully updated', type: MenuItemContainerItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Menu Item Component to update not found.' })
    @ApiBody({ type: UpdateMenuItemContainerItemDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemContainerItemDto): Promise<MenuItemContainerItem> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Menu Item Component' })
    @ApiNoContentResponse({ description: 'Menu Item Component successfully removed' })
    @ApiNotFoundResponse({ description: 'Menu Item Component not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Menu Item Components' })
    @ApiOkResponse({ type: PaginatedResult<MenuItemContainerItem> })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
            - containedItem name`,
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
        //@Query('search') search?: string,
        //@Query('filters') filters?: string[],
        //@Query('dateBy') dateBy?: string,
        //@Query('startDate') startDate?: string,  // ISO format string
        //@Query('endDate') endDate?: string, // ISO format string
    ): Promise<PaginatedResult<MenuItemContainerItem>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, undefined, undefined, undefined, undefined, undefined);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Menu Item Component' })
    @ApiOkResponse({ description: 'Menu Item Component found', type: MenuItemContainerItem })
    @ApiNotFoundResponse({ description: 'Menu Item Component not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItemContainerItem> {
        return super.findOne(id);
    }
}