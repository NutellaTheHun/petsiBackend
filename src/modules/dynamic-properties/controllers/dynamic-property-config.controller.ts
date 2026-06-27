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
    Patch,
    Post,
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
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/create-dynamic-property-config.dto';
import { UpdateDynamicPropertyConfigDto } from '../dto/dynamic-property-config/update-dynamic-property-config.dto';
import {
    DynamicPropertyConfig,
    DynamicPropertyConfigEntity,
} from '../entities/dynamic-property-config.entity';
import { DynamicPropertyConfigService } from '../services/dynamic-property-config.service';

@ApiTags('Dynamic Property Config')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('dynamic-property-configs')
@ApiExtraModels(DynamicPropertyConfig)
export class DynamicPropertyConfigController extends ControllerBase<DynamicPropertyConfigEntity> {
    constructor(
        service: DynamicPropertyConfigService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(service, cacheManager, 'DynamicPropertyConfigController', requestContextService, logger);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a DynamicPropertyConfig' })
    @ApiCreatedResponse({ type: DynamicPropertyConfig })
    @ApiBadRequestResponse({ description: 'Validation error' })
    @ApiBody({ type: CreateDynamicPropertyConfigDto })
    async create(@Body() dto: CreateDynamicPropertyConfigDto): Promise<DynamicPropertyConfig> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a DynamicPropertyConfig' })
    @ApiOkResponse({ type: DynamicPropertyConfig })
    @ApiBadRequestResponse({ description: 'Validation error' })
    @ApiNotFoundResponse({ description: 'DynamicPropertyConfig not found' })
    @ApiBody({ type: UpdateDynamicPropertyConfigDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDynamicPropertyConfigDto,
    ): Promise<DynamicPropertyConfig> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a DynamicPropertyConfig' })
    @ApiNoContentResponse({ description: 'Successfully removed' })
    @ApiNotFoundResponse({ description: 'DynamicPropertyConfig not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves all DynamicPropertyConfigs' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: { type: 'array', items: { $ref: getSchemaPath(DynamicPropertyConfig) } },
                nextCursor: { type: 'string' },
            },
        },
    })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    async findAll(
        @Query('relations') rawRelations?: string | string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ): Promise<PaginatedResult<DynamicPropertyConfig>> {
        return super.findAll(rawRelations, limit, cursor, sortBy, sortOrder);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one DynamicPropertyConfig' })
    @ApiOkResponse({ type: DynamicPropertyConfig })
    @ApiNotFoundResponse({ description: 'DynamicPropertyConfig not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<DynamicPropertyConfig> {
        return super.findOne(id);
    }
}
