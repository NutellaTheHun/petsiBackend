import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { CreateTemplateDto } from '../dto/template/create-template.dto';
import { UpdateTemplateDto } from '../dto/template/update-template.dto';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';

@ApiTags('Template')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('templates')
@ApiExtraModels(Template)
export class TemplateController extends ControllerBase<Template> {
    constructor(
        templateService: TemplateService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(templateService, cacheManager, 'TemplateController', requestContextService, logger); }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Template' })
    @ApiCreatedResponse({ description: 'Template successfully created', type: Template })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateTemplateDto })
    async create(@Body() dto: CreateTemplateDto): Promise<Template> {
        return super.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Template' })
    @ApiOkResponse({ description: 'Template successfully updated', type: Template })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Template to update not found.' })
    @ApiBody({ type: UpdateTemplateDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTemplateDto): Promise<Template> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Template' })
    @ApiNoContentResponse({ description: 'Template successfully removed' })
    @ApiNotFoundResponse({ description: 'Template not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Templates' })
    @ApiOkResponse({ type: PaginatedResult<Template> })
    async findAll(
        @Query('relations') relations?: string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
        @Query('dateBy') dateBy?: string,
        @Query('startDate') startDate?: string,  // ISO format string
        @Query('endDate') endDate?: string, // ISO format string
    ): Promise<PaginatedResult<Template>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, search, filters, dateBy, startDate, endDate);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Template' })
    @ApiOkResponse({ description: 'Template found', type: Template })
    @ApiNotFoundResponse({ description: 'Template not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Template> {
        return super.findOne(id);
    }
}