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
import { invalidateFindAllCache } from '../../../util/cache.util';
import { Roles } from '../../../util/decorators/PublicRole';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import {
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_STAFF,
} from '../../roles/utils/constants';
import { CreateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/create-menu-item-container-rule.dto';
import { UpdateMenuItemContainerRuleDto } from '../dto/menu-item-container-rule/update-menu-item-container-rule.dto';
import { MenuItemContainerRule } from '../entities/menu-item-container-rule.entity';
import { MenuItemContainerRuleService } from '../services/menu-item-container-rule.service';

@ApiTags('Menu Item Container Rules')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-container-rules')
@ApiExtraModels(MenuItemContainerRule)
export class MenuItemContainerRuleController extends ControllerBase<MenuItemContainerRule> {
  constructor(
    optionSerivce: MenuItemContainerRuleService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      optionSerivce,
      cacheManager,
      'MenuItemContainerRuleController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Creates a Menu item container component option (1 rule of the container options determing a valid menuItem and its allowed sizes)',
  })
  @ApiCreatedResponse({
    description: 'Component Option successfully created',
    type: MenuItemContainerRule,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemContainerRuleDto })
  async create(
    @Body() dto: CreateMenuItemContainerRuleDto,
  ): Promise<MenuItemContainerRule> {
    const result = await super.create(dto);

    await invalidateFindAllCache(
      'MenuItemContainerOptionsService',
      this.cacheManager,
    );

    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Component Option' })
  @ApiOkResponse({
    description: 'Component Option successfully updated',
    type: MenuItemContainerRule,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({ description: 'Menu Item Size to update not found.' })
  @ApiBody({ type: UpdateMenuItemContainerRuleDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemContainerRuleDto,
  ): Promise<MenuItemContainerRule> {
    const result = await super.update(id, dto);

    await invalidateFindAllCache(
      'MenuItemContainerOptionsService',
      this.cacheManager,
    );

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Component Option' })
  @ApiNoContentResponse({
    description: 'Component Option successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Component Option not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await super.remove(id);

    await invalidateFindAllCache(
      'MenuItemContainerOptionsService',
      this.cacheManager,
    );

    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Component Option' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(MenuItemContainerRule) },
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
                -validItem name`,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order: ASC or DESC',
  })
  async findAll(
    @Query('relations') rawRelations: string | string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    //@Query('search') search?: string,
    //@Query('filters') filters?: string[],
    //@Query('dateBy') dateBy?: string,
    //@Query('startDate') startDate?: string,  // ISO format string
    //@Query('endDate') endDate?: string, // ISO format string
  ): Promise<PaginatedResult<MenuItemContainerRule>> {
    return super.findAll(
      rawRelations,
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
  @ApiOperation({ summary: 'Retrieves one Component Option' })
  @ApiOkResponse({
    description: 'Component Option found',
    type: MenuItemContainerRule,
  })
  @ApiNotFoundResponse({ description: 'Component Option not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MenuItemContainerRule> {
    return super.findOne(id);
  }
}
