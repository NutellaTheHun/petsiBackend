import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { CreateOrderContainerItemDto } from "../dto/order-container-item/create-order-container-item.dto";
import { UpdateOrderContainerItemDto } from "../dto/order-container-item/update-order-container-item.dto";
import { OrderContainerItem } from "../entities/order-container-item.entity";
import { Order } from "../entities/order.entity";
import { OrderContainerItemService } from "../services/order-container-item.service";

@ApiTags('Order Container Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('order-container-item')
@ApiExtraModels(OrderContainerItem)
export class OrderContainerItemController extends ControllerBase<OrderContainerItem> {
    constructor(
        service: OrderContainerItemService,
        @Inject(CACHE_MANAGER) cacheManager: Cache,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(service, cacheManager, 'OrderMenuItemComponentController', requestContextService, logger); }

    /*@Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Creates a Order Menu Item Component' })
    @ApiCreatedResponse({ description: 'Order Menu Item Component successfully created', type: OrderMenuItemComponent })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiBody({ type: CreateOrderMenuItemComponentDto })*/
    /**
     * Depreciated, only created as a child through {@link Order}.
     */
    async create(@Body() dto: CreateOrderContainerItemDto): Promise<OrderContainerItem> {
        //return super.create(dto);
        throw new BadRequestException();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Updates a Order Menu Item Component' })
    @ApiOkResponse({ description: 'Order Menu Item Component successfully updated', type: OrderContainerItem })
    @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
    @ApiNotFoundResponse({ description: 'Order Menu Item Component to update not found.' })
    @ApiBody({ type: UpdateOrderContainerItemDto })
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderContainerItemDto): Promise<OrderContainerItem> {
        return super.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Removes a Order Menu Item Component' })
    @ApiNoContentResponse({ description: 'Order Menu Item Component successfully removed' })
    @ApiNotFoundResponse({ description: 'Order Menu Item Component not found' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return super.remove(id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves an array of Order Menu Item Component' })
    @ApiOkResponse({ type: PaginatedResult<OrderContainerItem> })
    @ApiQuery({ name: 'relations', required: false, isArray: true, type: String })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: String })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        type: String,
        description: `Field to sort by. Available options:\n
                - containedItem name`,
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
    ): Promise<PaginatedResult<OrderContainerItem>> {
        return super.findAll(relations, limit, cursor, sortBy, sortOrder, undefined, undefined, undefined, undefined, undefined);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Retrieves one Order Menu Item Component' })
    @ApiOkResponse({ description: 'Order Menu Item Component found', type: OrderContainerItem })
    @ApiNotFoundResponse({ description: 'Order Menu Item Component not found' })
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderContainerItem> {
        return super.findOne(id);
    }
}