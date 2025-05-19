import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { Label } from '../entities/label.entity';
import { LabelService } from '../services/label.service';
import { ApiTags, ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../../util/decorators/PublicRole';
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from '../../roles/utils/constants';
import { PaginatedResult } from '../../../base/paginated-result';
import { CreateLabelDto } from '../dto/label/create-label.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { UpdateLabelDto } from '../dto/label/update-label.dto';

@ApiTags('Label')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('labels')
export class LabelController extends ControllerBase<Label>{
  constructor(
    labelService: LabelService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(labelService, cacheManager, 'LabelController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Label' })
  @ApiCreatedResponse({ description: 'Label successfully created', type: Label })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateLabelDto })
  async create(@Body() dto: CreateLabelDto): Promise<Label> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Label' })
  @ApiOkResponse({ description: 'Label successfully updated', type: Label })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Label to update not found.' })
  @ApiBody({ type: UpdateLabelDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLabelDto): Promise<Label> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Label' })
  @ApiNoContentResponse({ description: 'Label successfully removed' })
  @ApiNotFoundResponse({ description: 'Label not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Labels' })
  @ApiOkResponse({ type: PaginatedResult<Label> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<Label>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Label' })
  @ApiOkResponse({ description: 'Label found', type: Label })
  @ApiNotFoundResponse({ description: 'Label not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Label> {
      return super.findOne(id);
  }
}