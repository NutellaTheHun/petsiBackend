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
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { Order } from '../entities/order.entity';
import { OrderService } from '../services/order.service';

@ApiTags('Order')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('order')
@ApiExtraModels(Order)
export class OrderController extends ControllerBase<Order> {
  constructor(
    orderService: OrderService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      orderService,
      cacheManager,
      'OrderController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Order' })
  @ApiCreatedResponse({
    description: 'Order successfully created',
    type: Order,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateOrderDto })
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Order' })
  @ApiOkResponse({ description: 'Order successfully updated', type: Order })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Order to update not found.' })
  @ApiBody({ type: UpdateOrderDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Order' })
  @ApiNoContentResponse({ description: 'Order successfully removed' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Orders' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(Order) },
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
    name: 'search',
    required: false,
    type: String,
    description: 'search by recipient name or orderItems menuItem name',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    isArray: true,
    type: String,
    description: `Filterable fields. Use format: field=value. Available filters:\n
          - **orderCategory** (e.g., \`orderCategory=5\`)`,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: `Field to sort by. Available options:\n
          - orderCategory name \n
          - recipient \n
          - fulfillmentDate \n
          - createdAt`,
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
    name: 'dateBy',
    required: false,
    type: String,
    description: '',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (inclusive) in ISO format (e.g., 2025-05-31)',
  })
  async findAll(
    @Query('relations') relations?: string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('search') search?: string,
    @Query('filters') filters?: string[],
    @Query('dateBy') dateBy?: string,
    @Query('startDate') startDate?: string, // ISO format string
    @Query('endDate') endDate?: string, // ISO format string
  ): Promise<PaginatedResult<Order>> {
    return super.findAll(
      relations,
      limit,
      cursor,
      sortBy,
      sortOrder,
      search,
      filters,
      dateBy,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Order' })
  @ApiOkResponse({ description: 'Order found', type: Order })
  @ApiNotFoundResponse({ description: 'Order not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return super.findOne(id);
  }
}
