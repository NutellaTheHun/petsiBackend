import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Cache } from "cache-manager";
import { ControllerBase } from "../../../base/controller-base";
import { PaginatedResult } from "../../../base/paginated-result";
import { Roles } from "../../../util/decorators/PublicRole";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_STAFF } from "../../roles/utils/constants";
import { CreateOrderMenuItemComponentDto } from "../dto/create-order-menu-item-component.dto";
import { UpdateOrderMenuItemComponentDto } from "../dto/update-order-menu-item-component.dto";
import { OrderMenuItemComponent } from "../entities/order-menu-item-component.entity";
import { OrderMenuItemComponentService } from "../services/order-menu-item-component.service";

@ApiTags('Order Menu Item Component')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('order-menu-item-component')
export class OrderMenuItemComponentController extends ControllerBase<OrderMenuItemComponent>{
  constructor(
    service: OrderMenuItemComponentService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(service, cacheManager, 'OrderMenuItemComponentController', requestContextService, logger); }
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Order Menu Item Component' })
  @ApiCreatedResponse({ description: 'Order Menu Item Component successfully created', type: OrderMenuItemComponent })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateOrderMenuItemComponentDto })
  async create(@Body() dto: CreateOrderMenuItemComponentDto): Promise<OrderMenuItemComponent> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Order Menu Item Component' })
  @ApiOkResponse({ description: 'Order Menu Item Component successfully updated', type: OrderMenuItemComponent })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Order Menu Item Component to update not found.' })
  @ApiBody({ type: UpdateOrderMenuItemComponentDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderMenuItemComponentDto): Promise<OrderMenuItemComponent> {
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
  @ApiOkResponse({ type: PaginatedResult<OrderMenuItemComponent> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<OrderMenuItemComponent>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Order Menu Item Component' })
  @ApiOkResponse({ description: 'Order Menu Item Component found', type: OrderMenuItemComponent })
  @ApiNotFoundResponse({ description: 'Order Menu Item Component not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderMenuItemComponent> {
      return super.findOne(id);
  }
}