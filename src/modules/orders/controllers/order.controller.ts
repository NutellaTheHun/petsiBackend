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
import { ControllerBase } from '../../../common/base/controller.base';
import { Roles } from '../../../common/decorators/PublicRole';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_STAFF,
} from '../../roles/utils/constants';
import { CreateOrderDto } from '../dto/order/create-order.dto';
import { OrderResponseDto } from '../dto/order/order-response.dto';
import { UpdateOrderDto } from '../dto/order/update-order.dto';
import { Order, OrderEntity } from '../entities/order.entity';
import { OrderService } from '../services/order.service';
import { orderToResponseDto } from '../utils/entity-transformers/order.dto.transformer';

@ApiTags('Order')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('orders')
@ApiExtraModels(Order)
export class OrderController extends ControllerBase<OrderEntity> {
    constructor(
        private readonly orderService: OrderService,
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

    /**
     * While majority of endpoints return the entity, this endpoint returns a response DTO. Due to the RecurringOrderSchedule entity DTO mapping not being direct to the object.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Order' })
    @ApiCreatedResponse({
        description: 'Order successfully created',
        type: OrderResponseDto,
    })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateOrderDto })
    async createOrderResponse(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
        const result = await super.create(dto);
        return orderToResponseDto(result);
    }

    // Not used, but kept for reference, 
    async create(@Body() dto: CreateOrderDto): Promise<Order> {
        return super.create(dto);
    }

    /**
     * While majority of endpoints return the entity, this endpoint returns a response DTO. Due to the RecurringOrderSchedule entity DTO mapping not being direct to the object.
     */
    @Put(':id')
    @ApiOperation({ summary: 'Updates a Order' })
    @ApiOkResponse({ description: 'Order successfully updated', type: OrderResponseDto })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Order to update not found.' })
    @ApiBody({ type: UpdateOrderDto })
    async updateOrderResponse(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto): Promise<OrderResponseDto> {
        const result = await super.update(id, dto);
        return orderToResponseDto(result);
    }

    // Not used, but kept for reference
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

    /**
     * While majority of endpoints return the entity, this endpoint returns a response DTO. Due to the RecurringOrderSchedule entity DTO mapping not being direct to the object.
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Orders' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(OrderResponseDto) },
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
          - **orderCategory** (e.g., \`orderCategory=5\`) \n
          - **isFrozen** (e.g., \`isFrozen=true\`) \n
          - **fulfillmentType** (e.g., \`fulfillmentType=pickup\`)`,
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
    async findAllOrderResponses(
        @Query('relations') rawRelations?: string | string[],
        @Query('limit') limit?: number,
        @Query('offset') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
        @Query('search') search?: string,
        @Query('filters') filters?: string[],
        @Query('dateBy') dateBy?: string,
        @Query('startDate') startDate?: string, // ISO format string
        @Query('endDate') endDate?: string, // ISO format string
    ): Promise<PaginatedResult<OrderResponseDto>> {
        const result = await super.findAll(
            rawRelations,
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
        return {
            items: result.items.map(item => orderToResponseDto(item)),
            nextCursor: result.nextCursor,
        } as PaginatedResult<OrderResponseDto>;
    }

    /**
     * Not used, but kept for reference, this endpoint returns the entity, which doesn't satisfy clients.
     */
    async findAll(
        @Query('relations') rawRelations?: string | string[],
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
            rawRelations,
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

    /**
     * While majority of endpoints return the entity, this endpoint returns a response DTO. Due to the RecurringOrderSchedule entity DTO mapping not being direct to the object.
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Order' })
    @ApiOkResponse({ description: 'Order found', type: OrderResponseDto })
    @ApiNotFoundResponse({ description: 'Order not found' })
    async findOneOrderResponse(@Param('id', ParseIntPipe) id: number): Promise<OrderResponseDto> {
        const result = await super.findOne(id);
        return orderToResponseDto(result);
    }

    /**
     * Not used, but kept for reference, this endpoint returns the entity, which doesn't satisfy clients.
     */
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
        return super.findOne(id);
    }
}
