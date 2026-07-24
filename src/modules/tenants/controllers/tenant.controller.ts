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
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { Tenant, TenantEntity } from '../entities/tenant.entity';
import { TenantService } from '../services/tenant.service';

@ApiTags('Tenant')
@ApiBearerAuth('access-token')
@Roles(ROLE_ADMIN)
@Controller('tenants')
@ApiExtraModels(Tenant)
export class TenantController extends ControllerBase<TenantEntity> {
    constructor(
        tenantService: TenantService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            tenantService,
            cacheManager,
            'TenantController',
            requestContextService,
            logger,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Tenant' })
    @ApiCreatedResponse({ description: 'Tenant successfully created', type: Tenant })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateTenantDto })
    async create(@Body() dto: CreateTenantDto): Promise<Tenant> {
        return super.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Updates a Tenant' })
    @ApiOkResponse({ description: 'Tenant successfully updated', type: Tenant })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Tenant to update not found.' })
    @ApiBody({ type: UpdateTenantDto })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTenantDto,
    ): Promise<Tenant> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Tenant' })
    @ApiNoContentResponse({ description: 'Tenant successfully removed' })
    @ApiNotFoundResponse({ description: 'Tenant not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Tenants' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(Tenant) },
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
                - name\n
                - subdomain`,
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
    ): Promise<PaginatedResult<Tenant>> {
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
    @ApiOperation({ summary: 'Retrieves one Tenant' })
    @ApiOkResponse({ description: 'Tenant found', type: Tenant })
    @ApiNotFoundResponse({ description: 'Tenant not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tenant> {
        return super.findOne(id);
    }
}
