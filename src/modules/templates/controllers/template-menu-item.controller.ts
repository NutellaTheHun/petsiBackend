import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../util/decorators/PublicRole';
import { PaginatedResult } from '../../../base/paginated-result';
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';

@ApiTags('Template Menu Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('template-menu-items')
export class TemplateMenuItemController extends ControllerBase<TemplateMenuItem>{
  constructor(
    templateService: TemplateMenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(templateService, cacheManager, 'TemplateMenuItemController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Template Menu Item' })
  @ApiCreatedResponse({ description: 'Template Menu Item successfully created', type: TemplateMenuItem })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateTemplateMenuItemDto })
  async create(@Body() dto: CreateTemplateMenuItemDto): Promise<TemplateMenuItem> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Template Menu Item' })
  @ApiOkResponse({ description: 'Template Menu Item successfully updated', type: TemplateMenuItem })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Template Menu Item to update not found.' })
  @ApiBody({ type: UpdateTemplateMenuItemDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTemplateMenuItemDto): Promise<TemplateMenuItem> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Template Menu Item' })
  @ApiNoContentResponse({ description: 'Template Menu Item successfully removed' })
  @ApiNotFoundResponse({ description: 'Template Menu Item not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Template Menu Items' })
  @ApiOkResponse({ type: PaginatedResult<TemplateMenuItem> })
  async findAll(
    @Query('relations') relations?: string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<TemplateMenuItem>> {
    return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Template Menu Item' })
  @ApiOkResponse({ description: 'Template Menu Item found', type: TemplateMenuItem })
  @ApiNotFoundResponse({ description: 'Template Menu Item not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TemplateMenuItem> {
    return super.findOne(id);
  }
}