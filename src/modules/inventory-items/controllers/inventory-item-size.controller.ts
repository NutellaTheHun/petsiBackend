import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
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
import { UpdateMenuItemSizeDto } from '../../menu-items/dto/menu-item-size/update-menu-item-size.dto';
import { RequestContextService } from '../../request-context/RequestContextService';
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateInventoryItemSizeDto } from '../dto/inventory-item-size/create-inventory-item-size.dto';
import { UpdateInventoryItemSizeDto } from '../dto/inventory-item-size/update-inventory-item-size.dto';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';

@ApiTags('Inventory Item Size')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('inventory-item-size')
@ApiExtraModels(InventoryItemSize)
export class InventoryItemSizeController extends ControllerBase<InventoryItemSize> {
  constructor(
    sizeService: InventoryItemSizeService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      sizeService,
      cacheManager,
      'InventoryItemSizeController',
      requestContextService,
      logger,
    );
  }

  /*@Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Inventory Item Size' })
    @ApiCreatedResponse({ description: 'Inventory Item Size successfully created', type: InventoryItemSize })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateInventoryItemSizeDto })*/
  /**
   * Depreciated, only created as a child through {@link InventoryItem}.
   */
  async create(
    @Body() dto: CreateInventoryItemSizeDto,
  ): Promise<InventoryItemSize> {
    throw new BadRequestException();
    //return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Inventory Item Size' })
  @ApiOkResponse({
    description: 'Inventory Item Size successfully updated',
    type: InventoryItemSize,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({
    description: 'Inventory Item Size to update not found.',
  })
  @ApiBody({ type: UpdateMenuItemSizeDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemSizeDto,
  ): Promise<InventoryItemSize> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Inventory Item Size' })
  @ApiNoContentResponse({
    description: 'Inventory Item Size successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Inventory Item Size not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Inventory Item Sizes' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(InventoryItemSize) },
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
            - cost`,
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
  ): Promise<PaginatedResult<InventoryItemSize>> {
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
  @ApiOperation({ summary: 'Retrieves one Inventory Item Size' })
  @ApiOkResponse({
    description: 'Inventory Item Size found',
    type: InventoryItemSize,
  })
  @ApiNotFoundResponse({ description: 'Inventory Item Size not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryItemSize> {
    return super.findOne(id);
  }
}
