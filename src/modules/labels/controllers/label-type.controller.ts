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
import { ControllerBase } from '../../../base/controller-base';
import { PaginatedResult } from '../../../base/paginated-result';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_STAFF,
} from '../../roles/utils/constants';
import { CreateLabelTypeDto } from '../dto/label-type/create-label-type.dto';
import { UpdateLabelTypeDto } from '../dto/label-type/update-label-type.dto';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeService } from '../services/label-type.service';

@ApiTags('Label Type')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('label-types')
@ApiExtraModels(LabelType)
export class LabelTypeController extends ControllerBase<LabelType> {
  constructor(
    labelTypeService: LabelTypeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      labelTypeService,
      cacheManager,
      'LabelTypeController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Label Type' })
  @ApiCreatedResponse({
    description: 'Label Type successfully created',
    type: LabelType,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateLabelTypeDto })
  async create(@Body() dto: CreateLabelTypeDto): Promise<LabelType> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Label Type' })
  @ApiOkResponse({
    description: 'Label Type successfully updated',
    type: LabelType,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Label Type to update not found.' })
  @ApiBody({ type: UpdateLabelTypeDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabelTypeDto,
  ): Promise<LabelType> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Label Type' })
  @ApiNoContentResponse({ description: 'Label Type successfully removed' })
  @ApiNotFoundResponse({ description: 'Label Type not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Label Types' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(LabelType) },
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
        - labelTypeName`,
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
  ): Promise<PaginatedResult<LabelType>> {
    return super.findAll(
      relations,
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
  @ApiOperation({ summary: 'Retrieves one Label Type' })
  @ApiOkResponse({ description: 'Label Type found', type: LabelType })
  @ApiNotFoundResponse({ description: 'Label Type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LabelType> {
    return super.findOne(id);
  }
}
