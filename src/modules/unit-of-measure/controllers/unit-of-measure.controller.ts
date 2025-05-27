import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateUnitOfMeasureDto } from '../dto/unit-of-measure/create-unit-of-measure.dto';
import { UpdateUnitOfMeasureDto } from '../dto/unit-of-measure/update-unit-of-measure.dto';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';

@ApiTags('Unit of Measure')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('unit-of-measure')
@ApiExtraModels(UnitOfMeasure)
export class UnitOfMeasureController extends ControllerBase<UnitOfMeasure> {
    constructor(
        unitService: UnitOfMeasureService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(unitService, cacheManager, 'UnitOfMeasureController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Unit of Measure' })
    @ApiCreatedResponse({ description: 'Unit of Measure successfully created', type: UnitOfMeasure })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateUnitOfMeasureDto })
    async create(@Body() dto: CreateUnitOfMeasureDto): Promise<UnitOfMeasure> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Unit of Measure' })
    @ApiOkResponse({ description: 'Unit of Measure successfully updated', type: UnitOfMeasure })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Unit of Measure to update not found.' })
    @ApiBody({ type: UpdateUnitOfMeasureDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUnitOfMeasureDto): Promise<UnitOfMeasure> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Unit of Measure' })
    @ApiNoContentResponse({ description: 'Unit of Measure successfully removed' })
    @ApiNotFoundResponse({ description: 'Unit of Measure not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Units of Measure' })
    @ApiOkResponse({ type: PaginatedResult<UnitOfMeasure> })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
            - name\n
            - category (by name, nulls last)`,
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
    ): Promise<PaginatedResult<UnitOfMeasure>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, undefined, undefined, undefined, undefined, undefined);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Unit of Measure' })
    @ApiOkResponse({ description: 'Unit of Measure found', type: UnitOfMeasure })
    @ApiNotFoundResponse({ description: 'Unit of Measure not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<UnitOfMeasure> {
        return super.findOne(id);
    }
}