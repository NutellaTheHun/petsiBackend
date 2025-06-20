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
import { CreateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/create-menu-item-container-options.dto';
import { UpdateMenuItemContainerOptionsDto } from '../dto/menu-item-container-options/update-menu-item-container-options.dto';
import { MenuItemContainerOptions } from '../entities/menu-item-container-options.entity';
import { MenuItemContainerOptionsService } from '../services/menu-item-container-options.service';

@ApiTags('Menu Item Container Options')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('menu-item-container-options')
@ApiExtraModels(MenuItemContainerOptions)
export class MenuItemContainerOptionsController extends ControllerBase<MenuItemContainerOptions> {
  constructor(
    optionsService: MenuItemContainerOptionsService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      optionsService,
      cacheManager,
      'MenuItemContainerOptionsController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates Menu Item Component Options' })
  @ApiCreatedResponse({
    description: 'Menu Item Component Options created',
    type: MenuItemContainerOptions,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateMenuItemContainerOptionsDto })
  async create(
    @Body() dto: CreateMenuItemContainerOptionsDto,
  ): Promise<MenuItemContainerOptions> {
    const result = await super.create(dto);

    await invalidateFindAllCache('MenuItemService', this.cacheManager);
    await invalidateFindAllCache(
      'MenuItemContainerRuleService',
      this.cacheManager,
    );

    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates Menu Item Component Options' })
  @ApiOkResponse({
    description: 'Menu Item Component Options successfully updated',
    type: MenuItemContainerOptions,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({
    description: 'Menu Item Component Options to update not found.',
  })
  @ApiBody({ type: UpdateMenuItemContainerOptionsDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemContainerOptionsDto,
  ): Promise<MenuItemContainerOptions> {
    const result = await super.update(id, dto);

    await invalidateFindAllCache('MenuItemService', this.cacheManager);
    await invalidateFindAllCache(
      'MenuItemContainerRuleService',
      this.cacheManager,
    );

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes Menu Item Component Options' })
  @ApiNoContentResponse({
    description: 'Menu Item Component Options successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Menu Item Component Options not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await super.remove(id);

    await invalidateFindAllCache('MenuItemService', this.cacheManager);
    await invalidateFindAllCache(
      'MenuItemContainerRuleService',
      this.cacheManager,
    );

    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieves an array of Menu Item Component Options',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(MenuItemContainerOptions) },
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
  async findAll(
    @Query('relations') rawRelations: string | string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    //@Query('sortBy') sortBy?: string,
    //@Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    //@Query('search') search?: string,
    //@Query('filters') filters?: string[],
    //@Query('dateBy') dateBy?: string,
    //@Query('startDate') startDate?: string,  // ISO format string
    //@Query('endDate') endDate?: string, // ISO format string
  ): Promise<PaginatedResult<MenuItemContainerOptions>> {
    return super.findAll(
      rawRelations,
      limit,
      cursor,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves Menu Item Component Options' })
  @ApiOkResponse({
    description: 'Menu Item Component Options found',
    type: MenuItemContainerOptions,
  })
  @ApiNotFoundResponse({ description: 'Menu Item Component Options not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MenuItemContainerOptions> {
    return super.findOne(id);
  }
}
