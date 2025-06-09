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
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateInventoryAreaCountDto } from '../dto/inventory-area-count/create-inventory-area-count.dto';
import { UpdateInventoryAreaCountDto } from '../dto/inventory-area-count/update-inventory-area-count.dto';
import { InventoryAreaCount } from '../entities/inventory-area-count.entity';
import { InventoryAreaCountService } from '../services/inventory-area-count.service';

@ApiTags('Inventory Area Count')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-area-count')
@ApiExtraModels(InventoryAreaCount)
export class InventoryAreaCountController extends ControllerBase<InventoryAreaCount> {
  constructor(
    areaCountService: InventoryAreaCountService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      areaCountService,
      cacheManager,
      'InventoryAreaCountController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates an Inventory Area Count' })
  @ApiCreatedResponse({
    description: 'Inventory Area Count successfully created',
    type: InventoryAreaCount,
  })
  @ApiBadRequestResponse({
    description: 'Bad request: ValidationException or DatabaseException',
  })
  @ApiBody({ type: CreateInventoryAreaCountDto })
  async create(
    @Body() dto: CreateInventoryAreaCountDto,
  ): Promise<InventoryAreaCount> {
    return super.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Updates a Inventory Area Count' })
  @ApiOkResponse({
    description: 'Inventory Area Count successfully updated',
    type: InventoryAreaCount,
  })
  @ApiBadRequestResponse({
    description: 'Bad request: ValidationException or DatabaseException',
  })
  @ApiNotFoundResponse({
    description: 'Inventory Area Count to update not found.',
  })
  @ApiBody({ type: UpdateInventoryAreaCountDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryAreaCountDto,
  ): Promise<InventoryAreaCount> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Inventory Area Count' })
  @ApiNoContentResponse({
    description: 'Inventory Area Count successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Inventory Area Count not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Inventory Area Count' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(InventoryAreaCount) },
        },
        nextCursor: {
          type: 'string',
          example: '2',
        },
      },
    },
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    isArray: true,
    type: String,
    description: `Filterable fields. Use format: field=value. Available filters:\n
      - **inventoryArea** (e.g., \`inventoryArea=5\`)`,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: `Field to sort by. Available options:\n
            - countDate\n
            - inventoryArea (by name)`,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order: ASC or DESC',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (inclusive) in ISO format (e.g., 2025-05-01)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (inclusive) in ISO format (e.g., 2025-05-31)',
  })
  @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: String })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by InventoryItem name',
  })
  async findAll(
    @Query('relations') relations?: string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('search') search?: string,
    @Query('filters') filters?: string[],
    //@Query('dateBy') dateBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaginatedResult<InventoryAreaCount>> {
    return super.findAll(
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
      search,
      filters,
      undefined,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Inventory Area Count' })
  @ApiOkResponse({
    description: 'Inventory Area Count found',
    type: InventoryAreaCount,
  })
  @ApiNotFoundResponse({ description: 'Inventory Area Count not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryAreaCount> {
    return super.findOne(id);
  }
}
