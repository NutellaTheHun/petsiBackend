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
import { CreateComponentOptionDto } from "../dto/create-component-option.dto";
import { UpdateComponentOptionDto } from "../dto/update-component-option.dto";
import { ComponentOption } from "../entities/component-option.entity";
import { ComponentOptionService } from "../services/component-option.service";

@ApiTags('Component Options')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('component-options')
export class ComponentOptionController extends ControllerBase<ComponentOption>{
  constructor(
    optionSerivce: ComponentOptionService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(optionSerivce, cacheManager, 'ComponentOptionController', requestContextService, logger); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Menu item container component option (1 rule of the container options determing a valid menuItem and its allowed sizes)' })
  @ApiCreatedResponse({ description: 'Component Option successfully created', type: ComponentOption })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateComponentOptionDto })
  async create(@Body() dto: CreateComponentOptionDto): Promise<ComponentOption> {
      return super.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Component Option' })
  @ApiOkResponse({ description: 'Component Option successfully updated', type: ComponentOption })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item Size to update not found.' })
  @ApiBody({ type: UpdateComponentOptionDto })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateComponentOptionDto): Promise<ComponentOption> {
      return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Component Option' })
  @ApiNoContentResponse({ description: 'Component Option successfully removed' })
  @ApiNotFoundResponse({ description: 'Component Option not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
      return super.remove(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Component Option' })
  @ApiOkResponse({ type: PaginatedResult<ComponentOption> })
  async findAll(
      @Query('relations') relations?: string[],
      @Query('limit') limit?: number,
      @Query('offset') cursor?: string,
      @Query('sortBy') sortBy?: string,
      @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ): Promise<PaginatedResult<ComponentOption>> {
      return super.findAll(relations, limit, cursor, sortBy, sortOrder);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves one Component Option' })
  @ApiOkResponse({ description: 'Component Option found', type: ComponentOption })
  @ApiNotFoundResponse({ description: 'Component Option not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ComponentOption> {
      return super.findOne(id);
  }
}