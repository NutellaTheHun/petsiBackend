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
import { CreateTemplateMenuItemDto } from '../dto/template-menu-item/create-template-menu-item.dto';
import { UpdateTemplateMenuItemDto } from '../dto/template-menu-item/update-template-menu-item.dto';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';

@ApiTags('Template Menu Item')
@ApiBearerAuth('access-token')
@Roles(ROLE_STAFF, ROLE_MANAGER, ROLE_ADMIN)
@Controller('template-menu-items')
@ApiExtraModels(TemplateMenuItem)
export class TemplateMenuItemController extends ControllerBase<TemplateMenuItem> {
  constructor(
    templateService: TemplateMenuItemService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      templateService,
      cacheManager,
      'TemplateMenuItemController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Template Menu Item' })
  @ApiCreatedResponse({
    description: 'Template Menu Item successfully created',
    type: TemplateMenuItem,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateTemplateMenuItemDto })
  async create(
    @Body() dto: CreateTemplateMenuItemDto,
  ): Promise<TemplateMenuItem> {
    const result = await super.create(dto);

    await invalidateFindAllCache('TemplateService', this.cacheManager);

    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Template Menu Item' })
  @ApiOkResponse({
    description: 'Template Menu Item successfully updated',
    type: TemplateMenuItem,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({
    description: 'Template Menu Item to update not found.',
  })
  @ApiBody({ type: UpdateTemplateMenuItemDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateMenuItemDto,
  ): Promise<TemplateMenuItem> {
    const result = await super.update(id, dto);

    await invalidateFindAllCache('TemplateService', this.cacheManager);

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Template Menu Item' })
  @ApiNoContentResponse({
    description: 'Template Menu Item successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Template Menu Item not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await super.remove(id);

    await invalidateFindAllCache('TemplateService', this.cacheManager);

    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Template Menu Items' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(TemplateMenuItem) },
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
            - tablePosIndex`,
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
  ): Promise<PaginatedResult<TemplateMenuItem>> {
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
  @ApiOperation({ summary: 'Retrieves one Template Menu Item' })
  @ApiOkResponse({
    description: 'Template Menu Item found',
    type: TemplateMenuItem,
  })
  @ApiNotFoundResponse({ description: 'Template Menu Item not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TemplateMenuItem> {
    return super.findOne(id);
  }
}
