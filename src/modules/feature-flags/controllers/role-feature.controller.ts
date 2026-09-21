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
import { CreateRoleFeatureDto } from '../dto/create-role-feature.dto';
import { UpdateRoleFeatureDto } from '../dto/update-role-feature.dto';
import { RoleFeature, RoleFeatureEntity } from '../entities/role-feature.entity';
import { RoleFeatureService } from '../services/role-feature.service';

@ApiTags('RoleFeature')
@ApiBearerAuth('access-token')
@Roles(ROLE_ADMIN)
@Controller('role-features')
@ApiExtraModels(RoleFeature)
export class RoleFeatureController extends ControllerBase<RoleFeatureEntity> {
    constructor(
        roleFeatureService: RoleFeatureService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            roleFeatureService,
            cacheManager,
            'RoleFeatureController',
            requestContextService,
            logger,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Grants a Feature to a Role' })
    @ApiCreatedResponse({ description: 'RoleFeature successfully created', type: RoleFeature })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateRoleFeatureDto })
    async create(@Body() dto: CreateRoleFeatureDto): Promise<RoleFeature> {
        return super.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'No-op: RoleFeature grants are added/removed, never edited in place' })
    @ApiOkResponse({ description: 'RoleFeature unchanged', type: RoleFeature })
    @ApiNotFoundResponse({ description: 'RoleFeature to update not found.' })
    @ApiBody({ type: UpdateRoleFeatureDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleFeatureDto,
    ): Promise<RoleFeature> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revokes a Feature grant from a Role' })
    @ApiNoContentResponse({ description: 'RoleFeature successfully removed' })
    @ApiNotFoundResponse({ description: 'RoleFeature not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of RoleFeatures' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(RoleFeature) },
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
    ): Promise<PaginatedResult<RoleFeature>> {
        return super.findAll(
            rawRelations,
            limit,
            cursor,
            sortBy,
            sortOrder,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        );
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one RoleFeature' })
    @ApiOkResponse({ description: 'RoleFeature found', type: RoleFeature })
    @ApiNotFoundResponse({ description: 'RoleFeature not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleFeature> {
        return super.findOne(id);
    }
}
