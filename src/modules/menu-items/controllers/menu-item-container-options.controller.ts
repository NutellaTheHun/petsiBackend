import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { CreateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/create-menu-item-container-options.dto";
import { UpdateMenuItemContainerOptionsDto } from "../dto/menu-item-container-options/update-menu-item-container-options.dto";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemContainerOptionsService } from "../services/menu-item-container-options.service";

@ApiTags('Menu Item Container Options')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-container-options')
export class MenuItemContainerOptionsController extends ControllerBase<MenuItemContainerOptions> {
    constructor(
        optionsService: MenuItemContainerOptionsService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(optionsService, cacheManager, 'MenuItemSizeController', requestContextService, logger); }

    /*@Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates Menu Item Component Options' })
    @ApiCreatedResponse({ description: 'Menu Item Component Options created', type: MenuItemComponentOptions })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateMenuItemComponentOptionsDto })*/
    /**
     * Depreciated, only created as a child through {@link MenuItem}.
     */
    async create(@Body() dto: CreateMenuItemContainerOptionsDto): Promise<MenuItemContainerOptions> {
        //return super.create(dto);
        throw new BadRequestException();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates Menu Item Component Options' })
    @ApiOkResponse({ description: 'Menu Item Component Options successfully updated', type: MenuItemContainerOptions })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Menu Item Component Options to update not found.' })
    @ApiBody({ type: UpdateMenuItemContainerOptionsDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemContainerOptionsDto): Promise<MenuItemContainerOptions> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes Menu Item Component Options' })
    @ApiNoContentResponse({ description: 'Menu Item Component Options successfully removed' })
    @ApiNotFoundResponse({ description: 'Menu Item Component Options not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Menu Item Component Options' })
    @ApiOkResponse({ type: PaginatedResult<MenuItemContainerOptions> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ): Promise<PaginatedResult<MenuItemContainerOptions>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves Menu Item Component Options' })
    @ApiOkResponse({ description: 'Menu Item Component Options found', type: MenuItemContainerOptions })
    @ApiNotFoundResponse({ description: 'Menu Item Component Options not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<MenuItemContainerOptions> {
        return super.findOne(id);
    }
}