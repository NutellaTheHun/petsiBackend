import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
    getSchemaPath,
} from '@nestjs/swagger';
import { Cache } from 'cache-manager';
import { invalidateFindAllCache } from '../../../infrastructure/cache/cache.util';
import { ControllerBase } from '../../../common/base/controller.base';
import { Roles } from '../../../common/decorators/PublicRole';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_STAFF,
} from '../../roles/utils/constants';
import { CreateMenuItemDto } from '../dto/menu-item/create-menu-item.dto';
import { UpdateMenuItemDto } from '../dto/menu-item/update-menu-item.dto';
import { MenuItem, MenuItemEntity } from '../entities/menu-item.entity';
import { MenuItemService } from '../services/menu-item.service';
import { REVISION_ENTITY_TYPES } from '../../revision-history/constants/revision-entity-type';
import { RevisionHistoryDetailDto } from '../../revision-history/dto/revision-history-detail.dto';
import { RevisionHistoryListItemDto } from '../../revision-history/dto/revision-history-list-item.dto';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';

@ApiTags('Menu Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-items')
@ApiExtraModels(MenuItem, RevisionHistoryListItemDto, RevisionHistoryDetailDto)
export class MenuItemController extends ControllerBase<MenuItemEntity> {
    constructor(
        private readonly menuItemService: MenuItemService,
        private readonly revisionHistoryService: RevisionHistoryService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            menuItemService,
            cacheManager,
            'MenuItemController',
            requestContextService,
            logger,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Menu Item' })
    @ApiCreatedResponse({
        description: 'Menu Item successfully created',
        type: MenuItem,
    })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateMenuItemDto })
    async create(@Body() dto: CreateMenuItemDto): Promise<MenuItem> {
        return super.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Updates a Menu Item' })
    @ApiOkResponse({
        description: 'Menu Item successfully updated',
        type: MenuItem,
    })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Menu Item to update not found.' })
    @ApiBody({ type: UpdateMenuItemDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMenuItemDto,
    ): Promise<MenuItem> {
        return super.update(id, dto);
    }

    @Get(':id/revisions')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Lists revision history for a menu item (metadata only)' })
    @ApiOkResponse({ type: [RevisionHistoryListItemDto] })
    async listMenuItemRevisions(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<RevisionHistoryListItemDto[]> {
        return this.revisionHistoryService.listRevisions(
            REVISION_ENTITY_TYPES.MENU_ITEM,
            id,
        );
    }

    @Get(':id/revisions/:revisionNumber')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Gets one menu item revision including payload' })
    @ApiOkResponse({ type: RevisionHistoryDetailDto })
    async getMenuItemRevision(
        @Param('id', ParseIntPipe) id: number,
        @Param('revisionNumber', ParseIntPipe) revisionNumber: number,
    ): Promise<RevisionHistoryDetailDto> {
        return this.revisionHistoryService.getRevisionOrThrow(
            REVISION_ENTITY_TYPES.MENU_ITEM,
            id,
            revisionNumber,
        );
    }

    @Put(':id/revisions/:revisionNumber/revert')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reverts a menu item to a previous revision' })
    @ApiOkResponse({ type: MenuItem })
    async revertMenuItem(
        @Param('id', ParseIntPipe) id: number,
        @Param('revisionNumber', ParseIntPipe) revisionNumber: number,
    ): Promise<MenuItem> {
        const result = await this.menuItemService.revertToRevision(
            id,
            revisionNumber,
        );
        await invalidateFindAllCache('MenuItemService', this.cacheManager);
        return result;
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
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(MenuItem) },
                },
                nextCursor: {
                    type: 'string',
                    example: '2',
                },
            },
        },
    })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'search by MenuItem name',
    })
    @ApiQuery({
        name: 'filters',
        required: false,
        isArray: true,
        type: String,
        description: `Filterable fields. Use format: field=value. Available filters:\n
          - **category** (e.g., \`category=5\`)
          - **type** (e.g., \`type=delivery\`)`,
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
        @Query('relations') rawRelations?: string | string[],
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
        return super.findAll(
            rawRelations,
            limit,
            cursor,
            sortBy,
            sortOrder,
            search,
            filters,
            undefined,
            undefined,
            undefined,
        );
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
