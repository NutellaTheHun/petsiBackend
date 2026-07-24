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
import { ControllerBase } from '../../../common/base/controller.base';
import { Roles } from '../../../common/decorators/PublicRole';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN } from '../../roles/utils/constants';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { Location, LocationEntity } from '../entities/location.entity';
import { LocationService } from '../services/location.service';

@ApiTags('Location')
@ApiBearerAuth('access-token')
@Roles(ROLE_ADMIN)
@Controller('locations')
@ApiExtraModels(Location)
export class LocationController extends ControllerBase<LocationEntity> {
    constructor(
        locationService: LocationService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            locationService,
            cacheManager,
            'LocationController',
            requestContextService,
            logger,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Location' })
    @ApiCreatedResponse({ description: 'Location successfully created', type: Location })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateLocationDto })
    async create(@Body() dto: CreateLocationDto): Promise<Location> {
        return super.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Updates a Location' })
    @ApiOkResponse({ description: 'Location successfully updated', type: Location })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Location to update not found.' })
    @ApiBody({ type: UpdateLocationDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateLocationDto,
    ): Promise<Location> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Location' })
    @ApiNoContentResponse({ description: 'Location successfully removed' })
    @ApiNotFoundResponse({ description: 'Location not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Locations' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(Location) },
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
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
                - name`,
    })
    @ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order: ASC or DESC',
    })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({
        name: 'filters',
        required: false,
        isArray: true,
        type: String,
        description: 'Filter by tenant id, e.g. filters=tenant=1',
    })
    async findAll(
        @Query('relations') rawRelations?: string | string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
    ): Promise<PaginatedResult<Location>> {
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
    @ApiOperation({ summary: 'Retrieves one Location' })
    @ApiOkResponse({ description: 'Location found', type: Location })
    @ApiNotFoundResponse({ description: 'Location not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Location> {
        return super.findOne(id);
    }
}
