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
import { CreateOrderCategoryDto } from '../dto/order-category/create-order-category.dto';
import { UpdateOrderCategoryDto } from '../dto/order-category/update-order-category.dto';
import { OrderCategory } from '../entities/order-category.entity';
import { OrderCategoryService } from '../services/order-category.service';

@ApiTags('Order Category')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('order-category')
@ApiExtraModels(OrderCategory)
export class OrderCategoryController extends ControllerBase<OrderCategory> {
  constructor(
    orderTypeService: OrderCategoryService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      orderTypeService,
      cacheManager,
      'OrderCategoryController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Order Type' })
  @ApiCreatedResponse({
    description: 'Order Type successfully created',
    type: OrderCategory,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateOrderCategoryDto })
  async create(@Body() dto: CreateOrderCategoryDto): Promise<OrderCategory> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Order Type' })
  @ApiOkResponse({
    description: 'Order Type successfully updated',
    type: OrderCategory,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Order Type to update not found.' })
  @ApiBody({ type: UpdateOrderCategoryDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderCategoryDto,
  ): Promise<OrderCategory> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Order Type' })
  @ApiNoContentResponse({ description: 'Order Type successfully removed' })
  @ApiNotFoundResponse({ description: 'Order Type not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Order Types' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(OrderCategory) },
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
            - categoryName`,
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
  ): Promise<PaginatedResult<OrderCategory>> {
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
  @ApiOperation({ summary: 'Retrieves one Order Type' })
  @ApiOkResponse({ description: 'Order Type found', type: OrderCategory })
  @ApiNotFoundResponse({ description: 'Order Type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderCategory> {
    return super.findOne(id);
  }
}
