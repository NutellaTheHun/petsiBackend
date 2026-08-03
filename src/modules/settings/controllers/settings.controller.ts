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
import { LocationScope } from '../../../common/decorators/LocationScope';
import { Roles } from '../../../common/decorators/PublicRole';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { EffectiveSettingDto } from '../dto/effective-setting.dto';
import { UpdateSettingDto } from '../dto/update-setting.dto';
import { Setting, SettingEntity } from '../entities/setting.entity';
import { SettingsService } from '../services/settings.service';

/**
 * Write authorization falls naturally out of RoleGuard's existing semantics
 * (no bespoke checks needed here): `create`'s `@LocationScope('body',
 * 'locationId')` means writing a location override (locationId present)
 * requires MANAGER/ADMIN at that specific location, while writing a
 * tenant-wide default (locationId omitted) can only pass for a caller whose
 * JWT carries `isTenantAdmin: true` (RoleGuard's tenant-admin bypass is the
 * only way past a `@LocationScope` check with no resolvable target
 * location). `update`/`remove` don't need `@LocationScope` at all — they
 * act on an existing row by id, and `SettingsService` (via
 * `LocationScopedServiceBase.findOne`) already re-verifies the caller is
 * authorized for that row's *actual* stored locationId before allowing the
 * write, which a client-supplied body field could otherwise be used to spoof.
 */
@ApiTags('Settings')
@ApiBearerAuth('access-token')
@Roles(ROLE_ADMIN)
@Controller('settings')
@ApiExtraModels(Setting)
export class SettingsController extends ControllerBase<SettingEntity> {
    constructor(
        private readonly settingsService: SettingsService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) {
        super(
            settingsService,
            cacheManager,
            'SettingsController',
            requestContextService,
            logger,
        );
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    @LocationScope('body', 'locationId')
    @ApiOperation({ summary: 'Creates a Setting (tenant default if locationId is omitted, location override otherwise)' })
    @ApiCreatedResponse({ description: 'Setting successfully created', type: Setting })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    async create(@Body() dto: CreateSettingDto): Promise<Setting> {
        return super.create(dto);
    }

    @Put(':id')
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    @ApiOperation({ summary: 'Updates a Setting\'s value' })
    @ApiOkResponse({ description: 'Setting successfully updated', type: Setting })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Setting to update not found.' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSettingDto,
    ): Promise<Setting> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles(ROLE_MANAGER, ROLE_ADMIN)
    @ApiOperation({ summary: 'Removes a Setting (a removed location override falls back to the tenant default)' })
    @ApiNoContentResponse({ description: 'Setting successfully removed' })
    @ApiNotFoundResponse({ description: 'Setting not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get('effective')
    @HttpCode(HttpStatus.OK)
    @Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
    @LocationScope('query', 'locationId')
    @ApiOperation({ summary: 'Returns the effective settings (tenant defaults with location overrides applied) for one location in a single call' })
    @ApiOkResponse({ description: 'Effective settings', type: EffectiveSettingDto, isArray: true })
    @ApiQuery({ name: 'locationId', required: false, type: Number })
    async getEffective(@Query('locationId') locationId?: number): Promise<EffectiveSettingDto[]> {
        return this.settingsService.getEffectiveSettings(
            locationId != null ? Number(locationId) : undefined,
        );
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Settings (raw rows)' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: { type: 'array', items: { $ref: getSchemaPath(Setting) } },
                nextCursor: { type: 'string', example: '2' },
            },
        },
    })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
          - name`,
    })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    async findAll(
        @Query('relations') rawRelations?: string | string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ): Promise<PaginatedResult<Setting>> {
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
    @ApiOperation({ summary: 'Retrieves one Setting' })
    @ApiOkResponse({ description: 'Setting found', type: Setting })
    @ApiNotFoundResponse({ description: 'Setting not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Setting> {
        return super.findOne(id);
    }
}
