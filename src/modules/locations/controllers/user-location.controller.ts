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
    ApiForbiddenResponse,
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
import { CreateUserLocationDto } from '../dto/create-user-location.dto';
import { UpdateUserLocationDto } from '../dto/update-user-location.dto';
import { UserLocation, UserLocationEntity } from '../entities/user-location.entity';
import { UserLocationService } from '../services/user-location.service';

@ApiTags('UserLocation')
@ApiBearerAuth('access-token')
@Roles(ROLE_ADMIN)
@Controller('user-locations')
@ApiExtraModels(UserLocation)
export class UserLocationController extends ControllerBase<UserLocationEntity> {
    constructor(
        userLocationService: UserLocationService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            userLocationService,
            cacheManager,
            'UserLocationController',
            requestContextService,
            logger,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Assigns a User to a Location with a set of Roles' })
    @ApiCreatedResponse({ description: 'UserLocation successfully created', type: UserLocation })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiForbiddenResponse({ description: 'Caller is not authorized for the target location' })
    @ApiBody({ type: CreateUserLocationDto })
    async create(@Body() dto: CreateUserLocationDto): Promise<UserLocation> {
        return super.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Updates a UserLocation assignment' })
    @ApiOkResponse({ description: 'UserLocation successfully updated', type: UserLocation })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'UserLocation to update not found.' })
    @ApiForbiddenResponse({ description: 'Caller is not authorized for the target location' })
    @ApiBody({ type: UpdateUserLocationDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserLocationDto,
    ): Promise<UserLocation> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a UserLocation assignment' })
    @ApiNoContentResponse({ description: 'UserLocation successfully removed' })
    @ApiNotFoundResponse({ description: 'UserLocation not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of UserLocation assignments' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(UserLocation) },
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
        name: 'filters',
        required: false,
        isArray: true,
        type: String,
        description: `Filterable fields. Use format: field=value. Available filters:\n
          - **user** (e.g., \`user=5\`)`,
    })
    async findAll(
        @Query('relations') rawRelations?: string | string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('filters') filters?: string | string[],
    ): Promise<PaginatedResult<UserLocation>> {
        const filterArray = filters
            ? Array.isArray(filters)
                ? filters
                : [filters]
            : undefined;
        return super.findAll(
            rawRelations,
            limit,
            cursor,
            undefined,
            undefined,
            undefined,
            filterArray,
            undefined,
            undefined,
            undefined,
        );
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one UserLocation assignment' })
    @ApiOkResponse({ description: 'UserLocation found', type: UserLocation })
    @ApiNotFoundResponse({ description: 'UserLocation not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserLocation> {
        return super.findOne(id);
    }
}
