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
import { ROLE_ADMIN, ROLE_MANAGER } from '../../roles/utils/constants';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';

@ApiTags('Recipe Ingredient')
@ApiBearerAuth('access-token')
@Roles(ROLE_MANAGER, ROLE_ADMIN)
@Controller('recipe-ingredients')
@ApiExtraModels(RecipeIngredient)
export class RecipeIngredientController extends ControllerBase<RecipeIngredient> {
  constructor(
    ingredientService: RecipeIngredientService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(
      ingredientService,
      cacheManager,
      'RecipeIngredientController',
      requestContextService,
      logger,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a Recipe Ingredient' })
  @ApiCreatedResponse({
    description: 'Recipe Ingredient successfully created',
    type: RecipeIngredient,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiBody({ type: CreateRecipeIngredientDto })
  async create(
    @Body() dto: CreateRecipeIngredientDto,
  ): Promise<RecipeIngredient> {
    const result = await super.create(dto);

    await invalidateFindAllCache('RecipeService', this.cacheManager);

    return result;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Updates a Recipe Ingredient' })
  @ApiOkResponse({
    description: 'Recipe Ingredient successfully updated',
    type: RecipeIngredient,
  })
  @ApiBadRequestResponse({ description: 'Bad request (validation error)' })
  @ApiNotFoundResponse({
    description: 'Recipe Ingredient to update not found.',
  })
  @ApiBody({ type: UpdateRecipeIngredientDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecipeIngredientDto,
  ): Promise<RecipeIngredient> {
    const result = await super.update(id, dto);

    await invalidateFindAllCache('RecipeService', this.cacheManager);

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Removes a Recipe Ingredient' })
  @ApiNoContentResponse({
    description: 'Recipe Ingredient successfully removed',
  })
  @ApiNotFoundResponse({ description: 'Recipe Ingredient not found' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const result = await super.remove(id);

    await invalidateFindAllCache('RecipeService', this.cacheManager);

    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieves an array of Recipe Ingredients' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(RecipeIngredient) },
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
            - ingredient (by name)`,
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order: ASC or DESC',
  })
  async findAll(
    @Query('relations') rawRelations?: string | string[],
    @Query('limit') limit?: number,
    @Query('offset') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    //@Query('search') search?: string,
    //@Query('filters') filters?: string[],
    //@Query('dateBy') dateBy?: string,
    //@Query('startDate') startDate?: string,  // ISO format string
    //@Query('endDate') endDate?: string, // ISO format string
  ): Promise<PaginatedResult<RecipeIngredient>> {
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
  @ApiOperation({ summary: 'Retrieves one Recipe Ingredient' })
  @ApiOkResponse({
    description: 'Recipe Ingredient found',
    type: RecipeIngredient,
  })
  @ApiNotFoundResponse({ description: 'Recipe Ingredient not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RecipeIngredient> {
    return super.findOne(id);
  }
}
